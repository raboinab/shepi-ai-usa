# ✅ WORKING Migration Plan - Deploy Migration Functions to OLD Project

**Key Insight:** You CAN deploy functions to Lovable Cloud (you just deployed migrate-helper successfully!)

**Solution:** Deploy the migration functions TO the OLD Lovable project, then run them to push data to NEW.

---

## The Functions You Need to Deploy to OLD Lovable Cloud

From the web-spreadsheet branch you just merged, these exist:

1. `migrate-push-data` - Pushes table data from OLD → NEW
2. `migrate-push-auth` - Pushes auth users  
3. `migrate-push-storage` - Pushes storage files

**These functions:**
- Read from OLD database (they have access since they run IN Lovable)
- Write to NEW database (using MIGRATION_TARGET_DB_URL secret)

---

## Step-by-Step Instructions

### STEP 1: Add Secrets to OLD Lovable Cloud (via Lovable UI)

Add these 3 secrets in OLD Lovable project:

```
MIGRATION_TARGET_DB_URL=postgresql://postgres.mdgmessqbfebrbvjtndz:aE8ZTC0Rgj4lO82V@aws-0-us-west-2.pooler.supabase.com:5432/postgres

MIGRATION_TARGET_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZ21lc3NxYmZlYnJidmp0bmR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzAwMzgzOCwiZXhwIjoyMDg4NTc5ODM4fQ.MhZxZlovas3uRs6IVFk6nW9MQ_us1mlHUP7qqGOtKAI

MIGRATION_TARGET_URL=https://mdgmessqbfebrbvjtndz.supabase.co
```

### STEP 2: Deploy Migration Functions to OLD Lovable

**Via Lovable UI** (same way you deployed migrate-helper):

Deploy these 3 functions (code is in your web-spreadsheet branch):
- `migrate-push-data` (from `supabase/functions/migrate-push-data/index.ts`)
- `migrate-push-auth` (from `supabase/functions/migrate-push-auth/index.ts`)
- `migrate-push-storage` (from `supabase/functions/migrate-push-storage/index.ts`)

**Or commit and push to git** (Lovable auto-deploys):
```bash
cd /Users/araboin/shepi/shepi-ai-web
git add supabase/functions/migrate-push-*
git commit -m "Add migration push functions"
git push origin web-spreadsheet
```

### STEP 3: Run the Migration via Admin UI

1. Go to OLD Lovable project: `https://sqwohcvobfnymsbzlfqr.supabase.co/admin/migration`
2. Click "Step 5 - Push table data"
3. Let it run (handles 300k rows automatically with chunking!)
4. Monitor progress

**The migration will:**
- Read all tables from OLD database
- Push to NEW database in chunks
- Handle 300k rows automatically
- Resume if interrupted

---

## Why This Works

- ✅ Functions run INSIDE Lovable Cloud (have DB access)
- ✅ Functions write to NEW database (using secrets you add)
- ✅ No need for external database access
- ✅ Handles large datasets (300k rows)
- ✅ Built-in chunking and resume capability

---

**This WILL work! You just need to:**
1. Add the 3 secrets to OLD Lovable project
2. Deploy the 3 migration functions to OLD Lovable
3. Run Step 5 from admin panel

**Estimated time:** 1 hour total (mostly waiting for 300k rows to transfer)
