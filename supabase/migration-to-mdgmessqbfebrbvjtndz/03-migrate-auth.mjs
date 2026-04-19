#!/usr/bin/env node
// Copies auth.users from OLD project to NEW project, preserving UUIDs.
// Email-password users will need to reset their password on first login
// (password hashes are not exposed by the Admin API).
// Google users will re-link automatically on first sign-in (matched by email).

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
  if (!v) {
    console.error(`Missing env var: ${k}`);
    process.exit(1);
  }
}

const oldClient = createClient(OLD_SUPABASE_URL, OLD_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const newClient = createClient(NEW_SUPABASE_URL, NEW_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function listAllUsers(client) {
  const all = [];
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    all.push(...data.users);
    if (data.users.length < perPage) break;
    page++;
  }
  return all;
}

const users = await listAllUsers(oldClient);
console.log(`Found ${users.length} users in old project.`);

let ok = 0, skipped = 0, failed = 0;

for (const u of users) {
  // Detect provider for logging
  const providers = (u.identities ?? []).map(i => i.provider).join(',') || 'unknown';

  const { data, error } = await newClient.auth.admin.createUser({
    id: u.id,                // CRITICAL: preserve UUID so all FKs keep working
    email: u.email,
    phone: u.phone ?? undefined,
    email_confirm: !!u.email_confirmed_at,
    phone_confirm: !!u.phone_confirmed_at,
    user_metadata: u.user_metadata ?? {},
    app_metadata: u.app_metadata ?? {},
  });

  if (error) {
    if (error.message?.includes('already') || error.status === 422) {
      skipped++;
      console.log(`SKIP  ${u.email} (${providers}) — already exists`);
    } else {
      failed++;
      console.error(`FAIL  ${u.email} (${providers}): ${error.message}`);
    }
  } else {
    ok++;
    console.log(`OK    ${u.email} (${providers}) → ${data.user.id}`);
  }
}

console.log(`\nDone. ok=${ok} skipped=${skipped} failed=${failed}`);
console.log('\nNext steps:');
console.log('  - Email-password users: send password reset emails or instruct them to use "Forgot password" on first login.');
console.log('  - Google users: configure Google OAuth in the new project (Authentication → Providers → Google) using the same Client ID/Secret. Identities will auto-link on first sign-in by matching email.');
