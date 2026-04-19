# Migration Secrets for Supabase Project Migration

## Values Retrieved via CLI

### ✅ MIGRATION_TARGET_SERVICE_ROLE_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZ21lc3NxYmZlYnJidmp0bmR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzAwMzgzOCwiZXhwIjoyMDg4NTc5ODM4fQ.MhZxZlovas3uRs6IVFk6nW9MQ_us1mlHUP7qqGOtKAI
```

### ✅ MIGRATION_TARGET_URL
```
https://mdgmessqbfebrbvjtndz.supabase.co
```

### ⚠️ MIGRATION_TARGET_DB_URL (Needs Database Password)

The database URL follows this format:
```
postgresql://postgres.mdgmessqbfebrbvjtndz:aE8ZTC0Rgj4lO82V@aws-0-us-west-1.pooler.supabase.com:6543/postgres
postgresql://postgres:aE8ZTC0Rgj4lO82V@db.mdgmessqbfebrbvjtndz.supabase.co:5432/postgres
postgresql://postgres.mdgmessqbfebrbvjtndz:aE8ZTC0Rgj4lO82V@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

**To get your database password:**

1. Go to: https://supabase.com/dashboard/project/mdgmessqbfebrbvjtndz/settings/database
2. Look for "Database Settings" → "Connection String"
3. Select "URI" format
4. Click "Copy" - this will give you the complete connection string with password

**Example (your actual values will be different):**
```
postgresql://postgres.mdgmessqbfebrbvjtndz:your-actual-password-here@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

---

## Add These Secrets to OLD Lovable Cloud Project

Once you have the database password and complete DB_URL, run these commands:

```bash
# Make sure you're on the OLD project
supabase link --project-ref sqwohcvobfnymsbzlfqr

# Add the secrets
supabase secrets set MIGRATION_TARGET_DB_URL='postgresql://postgres.mdgmessqbfebrbvjtndz:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres'

supabase secrets set MIGRATION_TARGET_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZ21lc3NxYmZlYnJidmp0bmR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzAwMzgzOCwiZXhwIjoyMDg4NTc5ODM4fQ.MhZxZlovas3uRs6IVFk6nW9MQ_us1mlHUP7qqGOtKAI'

supabase secrets set MIGRATION_TARGET_URL='https://mdgmessqbfebrbvjtndz.supabase.co'

# Verify they're set
supabase secrets list
```

---

## Next Steps After Adding Secrets

1. ✅ Verify all 3 secrets are set in the old project
2. 🚀 I'll build the migration tools (edge functions + admin UI)
3. 🔄 Run the migration from the admin portal
4. ✨ Cutover to the new database

---

**Note:** Keep this file secure and do NOT commit it to git (it's already in .gitignore patterns).
