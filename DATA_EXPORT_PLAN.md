# 🔄 Complete Data Migration Plan

**Goal:** Export ALL data from Lovable Cloud and import to NEW Supabase project  
**Challenge:** Lovable Cloud blocks direct database access  
**Status:** Need creative solution

---

## 🚫 Blocked Methods (Already Tried)

- ❌ Direct database connection (OLD_DB_URL not available)
- ❌ Service role key access (OLD_SERVICE_ROLE_KEY not available)
- ❌ Supabase CLI access to OLD project (permission denied)
- ❌ Admin UI export (you said too much data)

---

## ✅ Available Methods

### Method 1: Lovable Support Request (RECOMMENDED)

**Contact Lovable Support and request:**
- Full `pg_dump` of project `sqwohcvobfnymsbzlfqr`
- Or at minimum, CSV exports of these critical tables:
  - `processed_data`
  - `canonical_transactions`
  - `workflows`
  - `analysis_jobs`
  - `adjustment_proposals`
  - `chat_messages`
  - `reclassification_jobs`
  - `qoe_rag_chunks`
  - `project_embeddings`

**Support Contact:**
- Check Lovable Cloud dashboard for support options
- Or email their support team
- Mention you need to migrate off due to platform restrictions

**Expected Response Time:** 1-3 business days

---

### Method 2: Paginated Admin Export (If Possible)

If the admin UI has export but can't handle all data at once:

**Create a paginated export edge function:**
- Export 1000 rows at a time
- Download multiple CSV files
- Combine locally
- Import to NEW database

**Would you like me to build this?** It would work if Lovable allows querying in the admin panel.

---

### Method 3: Hybrid Approach (FASTEST)

**For tables with manageable data:**
1. Use existing `/admin/data-export` page in OLD Lovable project
2. Export in chunks if needed
3. Download CSVs

**For large tables:**
1. Request from Lovable support
2. Or build paginated export tool

**Tables and estimated sizes:**
- `processed_data`: Unknown size (likely large)
- `canonical_transactions`: Unknown size (likely large)
- `workflows`: Probably small
- `analysis_jobs`: Probably small
- `adjustment_proposals`: Probably medium
- `chat_messages`: Unknown size
- `reclassification_jobs`: Probably small

---

## 🛠️ What I Can Build Right Now

### Option A: Paginated Export Edge Function

Deploy to OLD Lovable Cloud project:
```typescript
// Edge function that exports data in chunks
// Call multiple times with different offsets
// Returns JSON/CSV for download
```

**Deployment challenge:** We can't deploy to OLD project (permission denied)

### Option B: Direct Database Bridge (If You Can Get OLD Credentials)

If you can somehow obtain:
- OLD database password (check Lovable Cloud dashboard settings)
- OR old anon key (less useful but might work for some tables)

Then I can build a tool that runs LOCALLY and pulls data.

---

## 🎯 RECOMMENDED ACTION PLAN

### Today (Immediate):

**Step 1: Check Lovable Cloud Dashboard** (15 min)
Look for:
- Database settings → Connection details
- Export features
- Data download options
- Support/Help section

**Step 2: Contact Lovable Support** (5 min)
Send this email:

```
Subject: Database Export Request for Migration

Hello Lovable Support,

I need to migrate my project (sqwohcvobfnymsbzlfqr) to an external Supabase 
instance due to platform limitations.

Can you please provide:
1. Full pg_dump of the public schema, OR
2. CSV exports of these tables:
   - processed_data
   - canonical_transactions
   - workflows
   - analysis_jobs
   - adjustment_proposals
   - chat_messages
   - reclassification_jobs
   - qoe_rag_chunks
   - project_embeddings

The export should include all rows and maintain data integrity for foreign keys.

Project ID: sqwohcvobfnymsbzlfqr
Urgency: High (production migration in progress)

Thank you,
[Your Name]
```

**Step 3: While Waiting** (Today)
- Deploy app with current data (85% functional)
- Users can start using NEW database for NEW work
- Historical data appears when Lovable responds

---

### Next Week (After Lovable Response):

**Step 4: Import Data** (30-60 min)
```bash
# If you get pg_dump from Lovable:
psql "$NEW_DB_URL" < lovable-export.sql

# If you get CSVs:
./migrate-data-locally.sh
```

**Step 5: Verify** (15 min)
```bash
# Check row counts match
psql "$NEW_DB_URL" -c "
SELECT 
  'processed_data', count(*) FROM processed_data
UNION ALL SELECT 'canonical_transactions', count(*) FROM canonical_transactions
UNION ALL SELECT 'workflows', count(*) FROM workflows;
"
```

---

## 🚨 If Lovable Won't Provide Data

**Last Resort Options:**

### 1. Screen Scrape via Admin UI
- If admin panel shows data, create a script to export it
- Tedious but possible for small-medium datasets

### 2. Recreate from Source
- Re-upload original documents to NEW database
- System re-processes everything
- Loses workflow history but rebuilds processed_data

### 3. Legal/Contract Review
- Check your Lovable Cloud contract
- You may have right to data portability
- GDPR/data ownership rights

---

## 📊 What We Know About the Data

From earlier checks on NEW database:
- OLD project had: processed_data (some unknown amount)
- OLD project had: canonical_transactions (some unknown amount)  
- OLD project had: workflows (some unknown amount)
- NEW project has: 0 rows in these tables

**We need to find out:**
- How many rows are we talking about?
- Can you see the data in Lovable Cloud admin UI?
- Can you run SQL queries in Lovable Cloud interface?

---

## 💡 Next Immediate Action

**Please answer these questions:**

1. Can you access the Lovable Cloud admin panel right now?
2. Can you see the tables/data in any UI?
3. Can you run SELECT queries in Lovable Cloud?
4. What happens when you try to export from admin UI? (specific error?)

**Based on your answers, I'll build the appropriate tool to get the data out.**

---

**Bottom Line:** We WILL get your data migrated, but need to work around Lovable's restrictions creatively.
