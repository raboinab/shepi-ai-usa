// Walks the `documents` storage bucket and emits a manifest with paths, sizes,
// and 24h signed download URLs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, requireAdmin, jsonResponse, errorResponse } from "../_shared/migration-auth.ts";

const BUCKET = "documents";

async function walk(admin: ReturnType<typeof createClient>, prefix: string, out: Array<{ path: string; size: number }>) {
  let offset = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await admin.storage.from(BUCKET).list(prefix, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const item of data) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      // Folders have null id
      if (item.id === null) {
        await walk(admin, fullPath, out);
      } else {
        out.push({ path: fullPath, size: (item.metadata as any)?.size ?? 0 });
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;
    const admin = createClient(auth.supabaseUrl, auth.serviceRoleKey);
    const files: Array<{ path: string; size: number }> = [];
    await walk(admin, "", files);

    // Sign in batches
    const manifest: Array<{ path: string; size: number; signed_url: string }> = [];
    const batchSize = 100;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const { data: signed, error } = await admin.storage
        .from(BUCKET)
        .createSignedUrls(batch.map((f) => f.path), 60 * 60 * 24);
      if (error) throw error;
      for (let j = 0; j < batch.length; j++) {
        manifest.push({
          path: batch[j].path,
          size: batch[j].size,
          signed_url: signed?.[j]?.signedUrl ?? "",
        });
      }
    }

    return jsonResponse({ bucket: BUCKET, files: manifest, count: manifest.length });
  } catch (e) {
    console.error("dump-storage-manifest error", e);
    return errorResponse(e instanceof Error ? e.message : String(e));
  }
});
