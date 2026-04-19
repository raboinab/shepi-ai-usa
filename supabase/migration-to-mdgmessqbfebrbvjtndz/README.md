# Migration: `sqwohcvobfnymsbzlfqr` (Lovable Cloud) → `mdgmessqbfebrbvjtndz` (external Supabase)

Run these scripts **from your local machine**. Lovable's sandbox cannot reach the new project's database directly.

## Prerequisites

Install once:

```bash
brew install postgresql@16 supabase/tap/supabase
npm i -g zx
```

You need **four** credentials. Get them from each project's dashboard → Project Settings → Database / API:

| Variable | Where to find it |
|---|---|
| `OLD_DB_URL` | Old project (Lovable Cloud) → Backend → Database → Connection string (URI, **session pooler / direct**, not transaction pooler) |
| `NEW_DB_URL` | New project → Settings → Database → Connection string (URI) |
| `OLD_SERVICE_ROLE_KEY` | Old project → Settings → API → `service_role` secret |
| `NEW_SERVICE_ROLE_KEY` | New project → Settings → API → `service_role` secret |

Export them in your shell (do **not** commit):

```bash
export OLD_DB_URL='postgresql://postgres.sqwohcvobfnymsbzlfqr:PWD@aws-0-us-east-1.pooler.supabase.com:5432/postgres'
export NEW_DB_URL='postgresql://postgres.mdgmessqbfebrbvjtndz:PWD@aws-0-XX-XX-X.pooler.supabase.com:5432/postgres'
export OLD_SERVICE_ROLE_KEY='eyJ...'
export NEW_SERVICE_ROLE_KEY='eyJ...'
export OLD_SUPABASE_URL='https://sqwohcvobfnymsbzlfqr.supabase.co'
export NEW_SUPABASE_URL='https://mdgmessqbfebrbvjtndz.supabase.co'
```

---

## Run order

```bash
# 1. Schema + data dump and restore (the big one)
bash 01-dump-and-restore.sh

# 2. Rewrite hardcoded URLs inside trigger functions
psql "$NEW_DB_URL" -f 02-rewrite-trigger-urls.sql

# 3. Migrate auth.users (preserves UUIDs so all FKs keep working)
node 03-migrate-auth.mjs

# 4. Copy storage bucket files
node 04-migrate-storage.mjs

# 5. Re-add secrets in new project (manual — see checklist)
cat 05-secrets-checklist.md

# 6. Redeploy edge functions
bash 06-deploy-functions.sh

# 7. Switch the app (manual — see "App cutover" below)
```

---

## What each step does

### 01 — Schema + data
Uses `pg_dump` against the **public** schema only (Supabase owns `auth`, `storage`, `realtime`, etc.). Restores into the new project. Includes: tables, columns, defaults, indexes, foreign keys, check constraints, sequences, triggers, functions, RLS policies, enums (`app_role`, `proof_validation_status`, `workflow_status`, `workflow_type`).

Extensions installed automatically by Supabase on the new project: `pgcrypto`, `uuid-ossp`, `vector`, `pg_net`, `pg_cron`. If `pg_net` or `vector` aren't pre-enabled in the new project, enable them in the dashboard → Database → Extensions **before** running.

### 02 — Rewrite trigger URLs
Three trigger functions hardcode `https://sqwohcvobfnymsbzlfqr.supabase.co`. This rewrites them to the new URL.

### 03 — Auth users
Reads `auth.users` from old project via service role, recreates them in the new project preserving the same UUID so every `user_id` foreign key in `public.*` keeps working.

**Email/password users (8):** Password hashes are *not* exposed via the Auth Admin API. Two options:
- (recommended) Force password reset on first sign-in
- (advanced) Use `pg_dump --schema=auth -t auth.users -t auth.identities` and restore directly — works only if both projects allow superuser DB access (Supabase typically does for the `postgres` user)

**Google OAuth users (17):** They re-link automatically on first sign-in (matched by email). You must re-configure Google OAuth credentials in the new project's auth settings first.

### 04 — Storage
Walks the old `documents` bucket, downloads each object, uploads to the new project's `documents` bucket at the same path. Creates the bucket if needed.

### 05 — Secrets
A checklist of the 27 secret names currently set on the old project. You paste the values yourself into the new project's Edge Functions → Secrets UI.

### 06 — Edge functions
Loops every directory in `supabase/functions/` and runs `supabase functions deploy <name> --project-ref mdgmessqbfebrbvjtndz`.

---

## App cutover

After all 6 steps succeed, point the React app at the new project. Because you're leaving Lovable Cloud, you do this **manually** (Lovable's `client.ts` and `.env` are auto-managed and would get overwritten otherwise):

1. In the new project's dashboard, copy the project URL and anon key.
2. Locally, edit `.env`:
   ```
   VITE_SUPABASE_URL=https://mdgmessqbfebrbvjtndz.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_fGI4_4JET6YLQzPYriQIZw_LNj7zu9w
   VITE_SUPABASE_PROJECT_ID=mdgmessqbfebrbvjtndz
   ```
3. Regenerate types:
   ```bash
   supabase gen types typescript --project-id mdgmessqbfebrbvjtndz > src/integrations/supabase/types.ts
   ```
4. Commit, deploy.

After this, **stop using Lovable's database tools.** The Lovable Cloud project still exists but is dead weight — you can disable it in Connectors → Lovable Cloud.

---

## Smoke tests after cutover

```bash
# 1. Row counts match
psql "$OLD_DB_URL" -c "SELECT 'projects', count(*) FROM projects UNION ALL SELECT 'documents', count(*) FROM documents UNION ALL SELECT 'processed_data', count(*) FROM processed_data UNION ALL SELECT 'canonical_transactions', count(*) FROM canonical_transactions;"
psql "$NEW_DB_URL" -c "SELECT 'projects', count(*) FROM projects UNION ALL SELECT 'documents', count(*) FROM documents UNION ALL SELECT 'processed_data', count(*) FROM processed_data UNION ALL SELECT 'canonical_transactions', count(*) FROM canonical_transactions;"

# 2. RLS still enforced
psql "$NEW_DB_URL" -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND rowsecurity=false;"
# expected: 0 rows

# 3. Sign in as a known user, confirm they see only their projects
```

## Known gotchas

- **`pg_net`** must be enabled before restore or trigger functions calling `net.http_post` will fail to create. Enable in dashboard first.
- **`vector` (pgvector)** dimension is 1536. `match_project_chunks` and `match_rag_chunks` rely on it.
- **`pg_cron` jobs** are not in `public` schema and not dumped. If you had any cron jobs (check `cron.job` in old DB), recreate them manually.
- **`current_setting('app.settings.service_role_key', true)`** in trigger functions: this is a Lovable-Cloud-specific pattern. On a regular Supabase project, this returns NULL and the `Authorization` header sent to your edge functions will be `Bearer `. Either (a) set this GUC at DB level: `ALTER DATABASE postgres SET app.settings.service_role_key = '...'` (NOT supported on Supabase managed) — so (b) rewrite those triggers to call the edge function with the new project's service role key hardcoded via Vault, or remove the bearer header and rely on `verify_jwt = false` on the receiving edge function. Step 02 leaves these as-is; revisit per function.
- **Realtime publication** `supabase_realtime` covers: adjustment_proposals, analysis_jobs, chat_messages, documents, projects, reclassification_jobs, workflows. Re-add on the new project (included in step 02).
