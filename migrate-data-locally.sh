#!/usr/bin/env bash
# Local Data Migration Script
# Migrates missing data from OLD Lovable Cloud DB to NEW Supabase DB
#
# Prerequisites:
# 1. You need access to the OLD Lovable Cloud database (even read-only via admin UI)
# 2. NEW_DB_URL connection string
# 3. psql installed (brew install postgresql@16)

set -euo pipefail

# NEW database connection (we have this)
NEW_DB_URL="postgresql://postgres.mdgmessqbfebrbvjtndz:aE8ZTC0Rgj4lO82V@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

echo "==================================================================="
echo "  DATA MIGRATION: Lovable Cloud → New Supabase"
echo "==================================================================="
echo ""
echo "Since we cannot access the OLD database directly via CLI,"
echo "this script will help you migrate data manually."
echo ""

# Create migration data directory
mkdir -p migration-data
cd migration-data

echo "Step 1: Export data from OLD Lovable Cloud database"
echo "---------------------------------------------------"
echo ""
echo "Option A: Use the Lovable Cloud admin UI"
echo "  1. Go to your Lovable Cloud project admin panel"
echo "  2. Export these tables as CSV:"
echo "     - processed_data"
echo "     - canonical_transactions"
echo "     - workflows"
echo "     - analysis_jobs"
echo "     - adjustment_proposals"
echo "     - chat_messages"
echo "     - reclassification_jobs"
echo "  3. Save CSV files to: $(pwd)"
echo ""
echo "Option B: If you have ANY database access to OLD project"
echo "  Export using this SQL and save as export.sql:"
echo ""
cat <<'EOF'
-- Copy this SQL and run it in Lovable Cloud query interface
COPY (SELECT * FROM processed_data) TO STDOUT WITH CSV HEADER;
-- Save output as processed_data.csv

COPY (SELECT * FROM canonical_transactions) TO STDOUT WITH CSV HEADER;  
-- Save output as canonical_transactions.csv

COPY (SELECT * FROM workflows) TO STDOUT WITH CSV HEADER;
-- Save output as workflows.csv

-- Repeat for other tables...
EOF

echo ""
echo "Press Enter when you have the CSV files ready..."
read

echo ""
echo "Step 2: Import data to NEW database"
echo "------------------------------------"

# Check if CSV files exist
TABLES=("processed_data" "canonical_transactions" "workflows" "analysis_jobs" "adjustment_proposals" "chat_messages" "reclassification_jobs")

for table in "${TABLES[@]}"; do
  CSV_FILE="${table}.csv"
  
  if [[ -f "$CSV_FILE" ]]; then
    echo "Importing $table..."
    psql "$NEW_DB_URL" <<SQL
\COPY $table FROM '$(pwd)/$CSV_FILE' WITH CSV HEADER;
SELECT 'Imported ' || COUNT(*) || ' rows into $table' FROM $table;
SQL
    echo "✅ $table imported"
  else
    echo "⏭️  Skipping $table (file not found: $CSV_FILE)"
  fi
done

echo ""
echo "Step 3: Verify row counts"
echo "-------------------------"

psql "$NEW_DB_URL" -c "
SELECT 
  'projects' as table_name, count(*) as rows FROM projects
UNION ALL SELECT 'documents', count(*) FROM documents  
UNION ALL SELECT 'processed_data', count(*) FROM processed_data
UNION ALL SELECT 'canonical_transactions', count(*) FROM canonical_transactions
UNION ALL SELECT 'workflows', count(*) FROM workflows
UNION ALL SELECT 'auth.users', count(*) FROM auth.users
ORDER BY table_name;
"

echo ""
echo "==================================================================="
echo "  ✅ Migration Complete!"
echo "==================================================================="
echo ""
echo "Next steps:"
echo "1. Test locally: npm run dev"
echo "2. Deploy: git push origin web-spreadsheet"
echo "3. Update Stripe webhook URL"
echo "4. Smoke test production"
echo ""

cd ..
