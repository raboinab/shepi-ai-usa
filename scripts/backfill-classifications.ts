import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables. Please provide SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("Fetching flagged transactions needing backfill...");
  
  const { data: transactions, error: fetchError } = await supabase
    .from('flagged_transactions')
    .select('*, projects(industry)')
    .is('classification_context', null);

  if (fetchError) {
    console.error("Error fetching transactions:", fetchError.message);
    return;
  }

  if (!transactions || transactions.length === 0) {
    console.log("No transactions found needing backfill.");
    return;
  }

  console.log(`Found ${transactions.length} transactions to backfill.`);

  for (const txn of transactions) {
    console.log(`Processing txn ${txn.id} (${txn.account_name})...`);
    
    // @ts-ignore - Supabase join typing workaround
    const industry = txn.projects?.industry || 'Unknown';
    
    let embedding;
    if (OPENAI_API_KEY) {
        const embedRes = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "text-embedding-3-small", input: `${industry} classification rules for ${txn.account_name} ${txn.description}` })
        });
        if (embedRes.ok) {
            const data = await embedRes.json();
            embedding = data.data[0].embedding;
        }
    }
    
    let ragContextText = "";
    let sources: string[] = [];
    if (embedding) {
        const { data: ragChunks } = await supabase.rpc('match_rag_chunks', {
            // Provide string representation of vector because PostgREST requires it for extensions.vector casting
            query_embedding: `[${embedding.join(',')}]`,
            match_threshold: 0.65,
            match_count: 3
        });
        
        if (ragChunks && ragChunks.length > 0) {
            ragContextText = ragChunks.map((c: any) => `[${c.source_title || c.source} - ${c.chapter || 'Guidance'}]: ${c.content}`).join('\n\n');
            sources = ragChunks.map((c: any) => c.source_title || c.source);
        }
    }
    
    if (!LOVABLE_API_KEY) {
        console.warn("  Skipping AI generation because LOVABLE_API_KEY is not set.");
        continue;
    }
    
    const prompt = `You are a senior Quality of Earnings accountant. Explain why the following transaction/account might be flagged for reclassification or adjustment.

Account: ${txn.account_name}
Description: ${txn.description}
Amount: ${txn.amount}
Flag Reason: ${txn.flag_reason}
Industry: ${industry}

Relevant Accounting Guidance:
${ragContextText || 'Use standard QoE and GAAP principles.'}

Return ONLY a concise, professional explanation (1-2 paragraphs) of why this is flagged and the proper classification, citing the guidance if applicable.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [{ role: "user", content: prompt }]
      })
    });
    
    if (aiRes.ok) {
        const aiData = await aiRes.json();
        const rationale = aiData.choices[0].message.content;
        
        const classificationContext = {
            industry,
            sources,
            explanation: rationale,
            rag_enhanced: true,
            backfilled_at: new Date().toISOString()
        };
        
        const { error: updateErr } = await supabase
            .from('flagged_transactions')
            .update({ classification_context: classificationContext })
            .eq('id', txn.id);
            
        if (updateErr) {
            console.error(`  Error updating txn ${txn.id}:`, updateErr.message);
        } else {
            console.log(`  Successfully updated txn ${txn.id}`);
        }
    } else {
        console.error(`  Failed to generate AI rationale for txn ${txn.id}:`, await aiRes.text());
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log("Backfill complete!");
}

main().catch(console.error);
