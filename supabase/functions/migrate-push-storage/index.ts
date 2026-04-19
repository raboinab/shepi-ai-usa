// Copies a batch of storage files from source 'documents' bucket to target.
// Client passes { paths: string[] } from the manifest.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, requireAdmin, jsonResponse, errorResponse } from "../_shared/migration-auth.ts";

const BUCKET = "documents";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const targetUrl = Deno.env.get("MIGRATION_TARGET_URL");
    const targetKey = Deno.env.get("MIGRATION_TARGET_SERVICE_ROLE_KEY");
    if (!targetUrl || !targetKey) return errorResponse("Target credentials not configured", 500);

    const body = await req.json().catch(() => ({}));
    const paths: string[] = Array.isArray(body.paths) ? body.paths : [];
    if (paths.length === 0) return errorResponse("paths array required", 400);
    if (paths.length > 25) return errorResponse("max 25 paths per call", 400);

    const src = createClient(auth.supabaseUrl, auth.serviceRoleKey);
    const tgt = createClient(targetUrl, targetKey, { auth: { persistSession: false } });

    // Ensure bucket exists on target
    try {
      await tgt.storage.createBucket(BUCKET, { public: false });
    } catch { /* exists */ }

    const results: Array<{ path: string; status: string; error?: string }> = [];
    for (const path of paths) {
      try {
        let blob: Blob | null = null;
        let dlErrMsg: string | null = null;
        try {
          const { data, error: dlErr } = await src.storage.from(BUCKET).download(path);
          if (dlErr) dlErrMsg = dlErr.message;
          else blob = data;
        } catch (sdkErr) {
          dlErrMsg = sdkErr instanceof Error ? sdkErr.message : String(sdkErr);
        }

        if (!blob) {
          // Fallback: raw fetch to source Storage REST
          const encodedPath = path.split("/").map(encodeURIComponent).join("/");
          const dlUrl = `${auth.supabaseUrl}/storage/v1/object/${BUCKET}/${encodedPath}`;
          try {
            const resp = await fetch(dlUrl, {
              headers: { Authorization: `Bearer ${auth.serviceRoleKey}` },
            });
            if (resp.ok) {
              blob = await resp.blob();
            } else {
              const body = (await resp.text()).slice(0, 300).replace(/\s+/g, " ");
              results.push({ path, status: "error", error: `DL HTTP ${resp.status}: ${body}` });
              continue;
            }
          } catch (fetchErr) {
            results.push({
              path,
              status: "error",
              error: `DL SDK: ${dlErrMsg ?? "no data"} | fetch: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`,
            });
            continue;
          }
        }
        let upErrMsg: string | null = null;
        let upOk = false;
        try {
          const { error: upErr } = await tgt.storage.from(BUCKET).upload(path, blob, {
            upsert: true,
            contentType: blob.type || "application/octet-stream",
          });
          if (!upErr) upOk = true;
          else upErrMsg = upErr.message;
        } catch (sdkErr) {
          upErrMsg = sdkErr instanceof Error ? sdkErr.message : String(sdkErr);
        }
        if (upOk) {
          results.push({ path, status: "uploaded" });
        } else {
          // Fallback: raw fetch to Storage REST to capture real status/body
          const encodedPath = path.split("/").map(encodeURIComponent).join("/");
          const url = `${targetUrl}/storage/v1/object/${BUCKET}/${encodedPath}`;
          try {
            const resp = await fetch(url, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${targetKey}`,
                "x-upsert": "true",
                "Content-Type": blob.type || "application/octet-stream",
              },
              body: blob,
            });
            if (resp.ok) {
              results.push({ path, status: "uploaded" });
            } else {
              const body = (await resp.text()).slice(0, 300).replace(/\s+/g, " ");
              results.push({ path, status: "error", error: `HTTP ${resp.status}: ${body}` });
            }
          } catch (fetchErr) {
            results.push({
              path,
              status: "error",
              error: `SDK: ${upErrMsg ?? "unknown"} | fetch: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`,
            });
          }
        }
      } catch (e) {
        results.push({ path, status: "error", error: e instanceof Error ? e.message : String(e) });
      }
    }

    const failed = results.filter((r) => r.status === "error");
    const summary = {
      total: results.length,
      uploaded: results.filter((r) => r.status === "uploaded").length,
      errors: failed.length,
    };
    if (failed.length > 0) {
      console.error(`migrate-push-storage: ${failed.length} failures in batch`, JSON.stringify(failed));
    }
    return jsonResponse({ summary, results, failed });
  } catch (e) {
    console.error("migrate-push-storage error", e);
    return errorResponse(e instanceof Error ? e.message : String(e));
  }
});
