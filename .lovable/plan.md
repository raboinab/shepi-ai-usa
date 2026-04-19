

## Goal
Get every byte out of this database to a place you control RIGHT NOW. Don't keep fighting `migrate-push-data` row-by-row — switch to a parallel "rip everything to disk" approach.

## Strategy: 3 parallel rip jobs, all writing to `/mnt/documents/` here in the sandbox

We have direct DB access via `psql` ($PGHOST is set), service-role keys for Auth and Storage, and the migration helper functions are already deployed. Use all three at once, no edge-function timeouts, no chunking gymnastics.

### Rip 1 — Public schema + ALL table data via `pg_dump`
The fastest, most reliable path. Skips the `migrate-push-data` row-by-row pain entirely.
```
pg_dump "$SUPABASE_DB_URL" \
  --schema=public --no-owner --no-privileges \
  --format=custom -f /mnt/documents/source-public.dump
```
- Single file, compressed, restorable with `pg_restore` into the new project.
- Handles oversized `processed_data` rows fine — pg_dump streams; no Deno OOM.
- Also dump plain SQL as a backup: `pg_dump ... --format=plain --inserts` to `/mnt/documents/source-public.sql`.

### Rip 2 — Auth users
Call the deployed `dump-auth-users` edge function with admin JWT, save JSON:
```
/mnt/documents/auth-users.json
```
(Includes identities so you can replay them on the target via `migrate-push-auth-hashes`.)

### Rip 3 — Storage (`documents` bucket)
Two sub-steps in parallel:
1. Call `dump-storage-manifest` → `/mnt/documents/storage-manifest.json` (paths + 24h signed URLs).
2. Stream every file from those signed URLs to `/mnt/documents/storage/<path>` using xargs parallel curl.

Bucket size could be large — we'll get a size estimate first and tell you the ETA before downloading.

## After everything is on disk
You have:
- `source-public.dump` — restore with one `pg_restore` command into ANY postgres
- `source-public.sql` — human-readable fallback
- `auth-users.json` — replay into target via existing `migrate-push-auth-hashes`
- `storage/` — re-upload via target's storage API

You can then either:
- Resume the dreamlit migration with `pg_restore` instead of `migrate-push-data` (drops the timeout problem entirely), OR
- Walk away from migrate-push-data and do schema+data restore directly into mdgmessqbfebrbvjtndz.

## What I need to switch to default mode for
All three rips need `code--exec` (pg_dump, curl, file writes). Read-only mode can't run them.

## Order of operations once approved
1. Confirm `pg_dump` is available + DB URL works (1 quick check)
2. Kick off `pg_dump --format=custom` to `/mnt/documents/` (background)
3. In parallel: curl `dump-auth-users` → save JSON
4. In parallel: curl `dump-storage-manifest` → save JSON, then estimate total bytes
5. Report sizes + ETA, then download storage files
6. Hand you the `/mnt/documents/` artifact list

