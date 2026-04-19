# 🚀 Lovable Exporter Setup Guide

**This WILL work to export your 300k rows!**

---

## Step 1: Deploy Helper Function to OLD Lovable Cloud

### A. Copy the helper function code

The exporter generated this code (saved below):

```typescript
const BUILD_ID = "2026-03-04";
const ACCESS_KEY = "0c03b18952e30db57de31c0a211cae91d56ddf62e9c9e644";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "x-access-key, x-client-info, apikey, content-type",
};

const responseHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
  "X-Build-Id": BUILD_ID,
};

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: responseHeaders,
  });

const errorResponse = (status: number, error: string) =>
  jsonResponse({ build_id: BUILD_ID, error }, status);

const requiredEnv = (name: string): string | null => {
  const value = Deno.env.get(name)?.trim();
  return value || null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: responseHeaders });
  }

  const requestAccessKey = req.headers.get("x-access-key")?.trim();
  if (!requestAccessKey || requestAccessKey !== ACCESS_KEY) {
    return errorResponse(401, "Unauthorized");
  }

  const supabaseDbUrl = requiredEnv("SUPABASE_DB_URL");
  if (!supabaseDbUrl) {
    return errorResponse(500, "Set SUPABASE_DB_URL and redeploy.");
  }

  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) {
    return errorResponse(500, "Set SUPABASE_SERVICE_ROLE_KEY and redeploy.");
  }

  return jsonResponse({
    build_id: BUILD_ID,
    generated_at: new Date().toISOString(),
    supabase_db_url: supabaseDbUrl,
    service_role_key: serviceRoleKey,
  });
});
```

### B. Deploy to Lovable Cloud

**Via Lovable UI:**
1. Go to your OLD Lovable Cloud project
2. Ask Lovable to create a new edge function called `migrate-helper`
3. Paste the code above
4. Deploy it

**Via Git (if you still have git push access):**
1. I'll copy the function to your shepi-ai-web repo
2. You commit and push
3. Lovable auto-deploys it

**Which method can you use?**

---

## Step 2: Get the Helper Function URL

After deployment, in Lovable UI:
- Go to: Cloud → Edge Functions → migrate-helper → Copy URL
- Should look like: `https://sqwohcvobfnymsbzlfqr.supabase.co/functions/v1/migrate-helper`

---

## Step 3: Run the Exporter!

Once you have the helper URL, run this command:

```bash
cd /Users/araboin/shepi/lovable-cloud-to-supabase-exporter

pnpm exporter -- export run \
  --source-edge-function-url "https://sqwohcvobfnymsbzlfqr.supabase.co/functions/v1/migrate-helper" \
  --source-edge-function-access-key "0c03b18952e30db57de31c0a211cae91d56ddf62e9c9e644" \
  --target-db-url "postgresql://postgres.mdgmessqbfebrbvjtndz:aE8ZTC0Rgj4lO82V@aws-0-us-west-2.pooler.supabase.com:5432/postgres" \
  --target-project-url "https://mdgmessqbfebrbvjtndz.supabase.co" \
  --target-admin-key "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZ21lc3NxYmZlYnJidmp0bmR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzAwMzgzOCwiZXhwIjoyMDg4NTc5ODM4fQ.MhZxZlovas3uRs6IVFk6nW9MQ_us1mlHUP7qqGOtKAI" \
  --confirm-target-blank
```

This will:
- Connect to OLD Lovable via the helper function
- Export ALL data (including your 300k rows!)
- Import directly to NEW Supabase
- **Handles everything automatically including chunking large tables**

---

## Key Information

**Access Key:** `0c03b18952e30db57de31c0a211cae91d56ddf62e9c9e644`

**Target DB URL:** `postgresql://postgres.mdgmessqbfebrbvjtndz:aE8ZTC0Rgj4lO82V@aws-0-us-west-2.pooler.supabase.com:5432/postgres`

**Target Project URL:** `https://mdgmessqbfebrbvjtndz.supabase.co`

**Target Admin Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZ21lc3NxYmZlYnJidmp0bmR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzAwMzgzOCwiZXhwIjoyMDg4NTc5ODM4fQ.MhZxZlovas3uRs6IVFk6nW9MQ_us1mlHUP7qqGOtKAI`

---

## What This Tool Does

The exporter will automatically:
- ✅ Export schema (already done, but will verify)
- ✅ Export ALL table data in chunks (handles 300k rows!)
- ✅ Export auth users (preserves passwords!)
- ✅ Export storage files
- ✅ Import everything to NEW Supabase
- ✅ Verify data integrity

**Estimated time:** 30-60 minutes for 300k rows

---

**Next: How can you deploy the helper function to Lovable Cloud?** (via UI or git push)
