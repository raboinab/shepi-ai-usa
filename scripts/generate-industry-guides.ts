import { createClient } from "@supabase/supabase-js";
import { INDUSTRIES, INDUSTRY_TRAITS, CATEGORY_DEFAULTS } from "../src/lib/industryConfig";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LOVABLE_API_KEY || !OPENAI_API_KEY) {
  console.error("Missing required environment variables.");
  console.error("Please provide: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LOVABLE_API_KEY, and OPENAI_API_KEY");
  console.error("Example: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/generate-industry-guides.ts");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function chunkText(text: string, chunkSize = 500, overlap = 100): string[] {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
    if (i + chunkSize >= words.length) break;
  }
  return chunks;
}

async function generateGuideForIndustry(industry: any, traits: any) {
  const prompt = `You are a senior Quality of Earnings (QoE) professional. Write a comprehensive Quality of Earnings & Account Classification Guide for the "${industry.label}" industry.
Focus strictly on:
1. Revenue recognition rules and common misclassifications
2. COGS vs. OpEx distinctions
3. Capitalization policies
4. Standard chart of accounts structure
5. Common EBITDA adjustments specific to this industry

Industry traits context:
- Labor Intensity: ${traits.laborIntensity}
- Revenue Recurrence: ${traits.revenueRecurrence}
- Seasonality: ${traits.seasonality}
- Working Capital Intensity: ${traits.workingCapitalIntensity}
- Known Risk Factors: ${traits.qoeRiskFactors?.join(', ') || 'N/A'}

Provide the output in structured markdown format. Make it highly authoritative and actionable.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate guide for ${industry.label}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function getEmbedding(text: string) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to embed text: ${await response.text()}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function main() {
  console.log(`Starting industry guide generation for ${INDUSTRIES.length} industries...`);

  for (const industry of INDUSTRIES) {
    console.log(`\nProcessing: ${industry.label} (${industry.id})`);
    
    try {
      const traits = {
        ...CATEGORY_DEFAULTS[industry.category],
        ...(INDUSTRY_TRAITS[industry.id] || {})
      };

      console.log(`- Generating guide via AI...`);
      const guideContent = await generateGuideForIndustry(industry, traits);
      
      const chunks = chunkText(guideContent, 400, 100);
      console.log(`- Split into ${chunks.length} chunks. Embedding and uploading...`);

      for (let i = 0; i < chunks.length; i++) {
        const content = chunks[i];
        const embedding = await getEmbedding(content);

        const { error } = await supabase.from('rag_chunks').insert({
          content,
          embedding,
          source: 'ai_industry_guide',
          source_title: `${industry.label} QoE Guide`,
          chapter: industry.label,
          section: `Chunk ${i + 1}`,
          chunk_index: i,
          topic_tags: [industry.id, industry.category, 'classification_rules'],
          authority_weight: 0.9,
        });

        if (error) {
          console.error(`  Error inserting chunk ${i} for ${industry.label}:`, error.message);
        }
      }
      
      console.log(`- Successfully processed ${industry.label}`);
    } catch (err) {
      console.error(`Failed to process ${industry.label}:`, err);
    }
  }
  
  console.log("\nFinished generating and uploading industry guides!");
}

main().catch(console.error);
