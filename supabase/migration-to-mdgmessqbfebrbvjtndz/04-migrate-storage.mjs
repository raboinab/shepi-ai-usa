#!/usr/bin/env node
// Copies all objects in the `documents` bucket from OLD to NEW project.
// Recursive: walks every folder. Idempotent: skips files already present in destination.

import { createClient } from '@supabase/supabase-js';

const {
  OLD_SUPABASE_URL,
  OLD_SERVICE_ROLE_KEY,
  NEW_SUPABASE_URL,
  NEW_SERVICE_ROLE_KEY,
} = process.env;

for (const [k, v] of Object.entries({
  OLD_SUPABASE_URL, OLD_SERVICE_ROLE_KEY, NEW_SUPABASE_URL, NEW_SERVICE_ROLE_KEY,
})) {
  if (!v) { console.error(`Missing env: ${k}`); process.exit(1); }
}

const BUCKET = 'documents';
const PAGE_SIZE = 1000;

const oldDb = createClient(OLD_SUPABASE_URL, OLD_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const newDb = createClient(NEW_SUPABASE_URL, NEW_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Ensure bucket exists in destination
{
  const { data: buckets } = await newDb.storage.listBuckets();
  if (!buckets?.find(b => b.name === BUCKET)) {
    const { error } = await newDb.storage.createBucket(BUCKET, { public: false });
    if (error) { console.error('Failed to create bucket:', error); process.exit(1); }
    console.log(`Created bucket "${BUCKET}" in new project.`);
  }
}

async function* walk(prefix = '') {
  let offset = 0;
  while (true) {
    const { data, error } = await oldDb.storage.from(BUCKET).list(prefix, {
      limit: PAGE_SIZE, offset, sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw error;
    if (!data || data.length === 0) return;
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      // Folders have id === null in Supabase storage
      if (entry.id === null) {
        yield* walk(path);
      } else {
        yield { path, size: entry.metadata?.size, contentType: entry.metadata?.mimetype };
      }
    }
    if (data.length < PAGE_SIZE) return;
    offset += PAGE_SIZE;
  }
}

let ok = 0, skipped = 0, failed = 0;

for await (const file of walk()) {
  // Check if exists in new bucket
  const dir = file.path.includes('/') ? file.path.slice(0, file.path.lastIndexOf('/')) : '';
  const name = file.path.includes('/') ? file.path.slice(file.path.lastIndexOf('/') + 1) : file.path;
  const { data: existing } = await newDb.storage.from(BUCKET).list(dir, { search: name, limit: 1 });
  if (existing?.find(e => e.name === name)) {
    skipped++;
    continue;
  }

  const { data: blob, error: dlErr } = await oldDb.storage.from(BUCKET).download(file.path);
  if (dlErr) { failed++; console.error(`DL FAIL ${file.path}: ${dlErr.message}`); continue; }

  const { error: upErr } = await newDb.storage.from(BUCKET).upload(file.path, blob, {
    contentType: file.contentType ?? blob.type ?? 'application/octet-stream',
    upsert: false,
  });
  if (upErr) { failed++; console.error(`UP FAIL ${file.path}: ${upErr.message}`); continue; }

  ok++;
  if (ok % 50 === 0) console.log(`Copied ${ok} files...`);
}

console.log(`\nDone. ok=${ok} skipped=${skipped} failed=${failed}`);
