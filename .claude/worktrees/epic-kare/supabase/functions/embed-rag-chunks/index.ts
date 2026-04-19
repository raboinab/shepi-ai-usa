import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface ChunkInput {
  content: string;
  source: string;           // Required: 'oglove', 'edwards', 'openstax'
  source_title?: string;
  source_license?: string;
  chapter?: string;
  section?: string;
  page_number?: number;
  chunk_index: number;
  topic_tags?: string[];
  authority_weight?: number;
  token_count?: number;
}

interface UploadStats {
  total: number;
  successful: number;
  errors: number;
  source: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
      throw new Error("Missing configuration");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Validate admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - missing auth header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Forbidden - admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[embed-rag-chunks] Admin access granted for user ${userData.user.id}`);

    // Get chunks and metadata from request body
    const { chunks, source, source_title, source_license, authority_weight } = await req.json() as {
      chunks: ChunkInput[];
      source: string;
      source_title?: string;
      source_license?: string;
      authority_weight?: number;
    };

    if (!source) {
      return new Response(
        JSON.stringify({ error: "Source is required (e.g., 'oglove', 'edwards', 'openstax')" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return new Response(
        JSON.stringify({ error: "No chunks provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${chunks.length} chunks for source: ${source}...`);

    // Initialize Supabase client with service role (already created above)
    // const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let successCount = 0;
    let errorCount = 0;
    const batchSize = 10; // Process 10 chunks at a time

    // Process in batches to avoid rate limits
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}...`);

      // Generate embeddings for this batch
      const embeddingPromises = batch.map(async (chunk) => {
        try {
          // Call OpenAI embeddings API
          const response = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "text-embedding-3-small",
              input: chunk.content,
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${response.status} ${error}`);
          }

          const data = await response.json();
          const embedding = data.data[0].embedding;

          return {
            chunk,
            embedding,
          };
        } catch (error) {
          console.error(`Error embedding chunk ${chunk.chunk_index}:`, error);
          return null;
        }
      });

      const results = await Promise.all(embeddingPromises);

      // Insert chunks with embeddings into new rag_chunks table
      for (const result of results) {
        if (!result) {
          errorCount++;
          continue;
        }

        const { chunk, embedding } = result;

        const { error } = await supabase
          .from("rag_chunks")
          .insert({
            content: chunk.content,
            embedding: embedding,
            source: chunk.source || source,
            source_title: chunk.source_title || source_title || null,
            source_license: chunk.source_license || source_license || 'proprietary',
            chapter: chunk.chapter || null,
            section: chunk.section || null,
            page_number: chunk.page_number || null,
            chunk_index: chunk.chunk_index,
            topic_tags: chunk.topic_tags || [],
            authority_weight: chunk.authority_weight ?? authority_weight ?? 1.0,
            token_count: chunk.token_count || null,
            metadata: {
              processed_at: new Date().toISOString(),
            },
          });

        if (error) {
          console.error(`Error inserting chunk ${chunk.chunk_index}:`, error);
          errorCount++;
        } else {
          successCount++;
        }
      }

      // Small delay between batches to respect rate limits
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Completed: ${successCount} successful, ${errorCount} errors for source: ${source}`);

    const stats: UploadStats = {
      total: chunks.length,
      successful: successCount,
      errors: errorCount,
      source: source,
    };

    return new Response(
      JSON.stringify({
        success: true,
        ...stats,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in embed-rag-chunks function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
