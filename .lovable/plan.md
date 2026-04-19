
The user is configuring the Supabase Auth "Send Email" hook in the dashboard and is asking which option to pick. They have an edge function (`auth-email-hook`) deployed at the Supabase Functions URL, so they want **HTTPS**, not Postgres.

## What to choose

**Hook type: HTTPS**

Then fill in:

- **URL**: `https://mdgmessqbfebrbvjtndz.supabase.co/functions/v1/auth-email-hook`
- **Secret**: generate a `v1,whsec_...` secret in the dashboard's "Generate secret" button. Copy it.

## After saving in the dashboard

1. Add the generated secret to edge function secrets as `SEND_EMAIL_HOOK_SECRET` (paste the full `v1,whsec_...` value — the function strips the prefix automatically).
2. The auth-email-hook function will then verify incoming webhook signatures from Supabase Auth and send via Resend using the existing React Email templates.

## Why HTTPS, not Postgres

Postgres hooks only work with `plpgsql` functions inside the database. Email sending requires calling Resend over HTTP, rendering React Email templates, and signature verification — all of which live in the deployed Deno edge function, not in Postgres.

No code changes needed — just configuration in two places (Supabase Auth Hooks dashboard + edge function secret).
