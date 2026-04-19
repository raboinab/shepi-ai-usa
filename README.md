# Shepi AI

Quality of Earnings (QoE) analysis platform for M&A professionals. Shepi ingests
client financials (QuickBooks, trial balances, GL exports, supporting documents),
runs them through an in-app workbook engine and AI discovery pipeline, and
produces an analyst-grade diligence report.

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind + shadcn/ui
- **Backend:** Lovable Cloud (Postgres + Edge Functions + Storage + Auth)
- **Workbook engine:** in-app, client-side (no Google Sheets dependency)
- **AI:** OpenAI (direct) for discovery, verification, and RAG; Lovable AI for
  select chat/insights flows
- **Payments:** Stripe (via Stripe connector)

## Getting started

```sh
bun install
bun run dev
```

Environment variables (`VITE_SUPABASE_*`) are auto-provisioned by Lovable Cloud.
Do not edit `.env`, `src/integrations/supabase/client.ts`, or
`src/integrations/supabase/types.ts` — they are managed automatically.

## Canonical docs

- [`ENGINEERING_DOCTRINE.md`](./ENGINEERING_DOCTRINE.md) — architecture rules,
  the "workbook is the spine" doctrine, tab inventory, data flow.
- [`RAG_LEGAL_COMPLIANCE.md`](./RAG_LEGAL_COMPLIANCE.md) — sourcing/licensing
  policy for RAG content.

Operational knowledge (accounting rules, AI pipeline contracts, known
constraints) lives in project memory under `mem://` and is loaded into context
automatically.

## Project layout

```
src/
├── components/     # UI (wizard, workbook tabs, insights, admin)
├── lib/            # workbook engine, calculations, adapters
├── hooks/          # React hooks
├── pages/          # routed pages
└── integrations/   # auto-generated Supabase client + types

supabase/
├── functions/      # edge functions (auto-deployed)
└── migrations/     # database migrations (managed via tooling)
```
