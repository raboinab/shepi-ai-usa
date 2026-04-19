#!/usr/bin/env bash
# Dumps the public schema (structure + data) from old project and restores into new.
# Requires: pg_dump 16+, psql 16+, $OLD_DB_URL, $NEW_DB_URL exported.
set -euo pipefail

: "${OLD_DB_URL:?Set OLD_DB_URL}"
: "${NEW_DB_URL:?Set NEW_DB_URL}"

DUMP_DIR="$(dirname "$0")/dumps"
mkdir -p "$DUMP_DIR"
SCHEMA_FILE="$DUMP_DIR/public-schema.sql"
DATA_FILE="$DUMP_DIR/public-data.sql"

echo "==> 1/4  Dumping public schema (structure only)"
pg_dump "$OLD_DB_URL" \
  --schema=public \
  --schema-only \
  --no-owner \
  --no-privileges \
  --no-publications \
  --no-subscriptions \
  --no-comments \
  > "$SCHEMA_FILE"

echo "==> 2/4  Dumping public data (data only, COPY format, disable triggers)"
pg_dump "$OLD_DB_URL" \
  --schema=public \
  --data-only \
  --no-owner \
  --no-privileges \
  --disable-triggers \
  --column-inserts=false \
  > "$DATA_FILE"

echo "==> 3/4  Restoring schema into new project"
# The new project already has Supabase boilerplate. Drop conflicting objects first.
psql "$NEW_DB_URL" <<'SQL'
-- Make sure required extensions are present (idempotent)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS vector    WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net;
SQL

psql "$NEW_DB_URL" \
  --single-transaction \
  --set ON_ERROR_STOP=on \
  -f "$SCHEMA_FILE"

echo "==> 4/4  Restoring data into new project (this can take a while)"
psql "$NEW_DB_URL" \
  --set ON_ERROR_STOP=on \
  -f "$DATA_FILE"

echo "==> Done. Run 02-rewrite-trigger-urls.sql next."
