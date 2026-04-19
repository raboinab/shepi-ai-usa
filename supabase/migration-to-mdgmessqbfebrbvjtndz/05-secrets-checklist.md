# Secrets to recreate in the new project

Open new project → Edge Functions → Secrets. Add each of the following with the same value as in the old project.

> Lovable Cloud auto-provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `SUPABASE_PUBLISHABLE_KEY` automatically — on a regular Supabase project these names are reserved and **also** auto-provided. Do not set them manually.

## Manual secrets to add (22)

- [ ] `ANTHROPIC_API_KEY`
- [ ] `DISCOVERY_API_KEY`
- [ ] `DISCOVERY_SERVICE_KEY`
- [ ] `DISCOVERY_SERVICE_URL`
- [ ] `DOCUCLIPPER_API_KEY`
- [ ] `DOCUCLIPPER_API_URL`
- [ ] `LLM_EXTRACTOR_API_KEY`
- [ ] `LLM_EXTRACTOR_URL`
- [ ] `LOVABLE_API_KEY` *(only needed if you keep using Lovable AI Gateway from edge functions; if you're fully off Lovable, swap to direct OpenAI/Anthropic calls)*
- [ ] `OPENAI_API_KEY`
- [ ] `QB_AUTH_API_KEY`
- [ ] `QBTOJSON_API_KEY`
- [ ] `QBTOJSON_API_URL`
- [ ] `QUICKBOOKS_API_KEY`
- [ ] `QUICKBOOKS_API_URL`
- [ ] `RESEND_API_KEY`
- [ ] `SHEPI_SHEETS_API_KEY`
- [ ] `SHEPI_SHEETS_API_URL`
- [ ] `STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_SK` *(duplicate of `STRIPE_SECRET_KEY`; keep both for backward compat)*
- [ ] `STRIPE_WEBHOOK_SECRET` — **regenerate** after pointing the Stripe webhook at the new project's URL
