# Answer-Engine SEO + Directory Plan

Deliverable for making Shepi discoverable when users ask ChatGPT / Claude / Perplexity about Quality of Earnings.

---

## Part A — Audit findings (Semrush, US database)

### What's already right (don't touch)

- **Head metadata**: `useSEO` / `SEO` component emits per-route `<title>`, `<meta description>`, canonical, OG, Twitter — hoisted into prerendered HTML via React 19.
- **Schema.org**: FAQPage JSON-LD on `/quality-of-earnings-cost`, Article + BreadcrumbList on guide pages, Organization sitewide.
- **AI/agent discovery**: `/llms.txt`, `/llms-full.txt`, `/.well-known/agent.json`, `/.well-known/ai-plugin.json`, `/mcp.json`, `/openapi.json` — this is more than 99% of SaaS sites have.
- **Crawler policy**: `robots.txt` explicitly allows `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`.
- **Content depth**: ~20 guide pages covering the QoE topic cluster with real, quotable definitions.

### Where you actually stand (Semrush)

| Metric | Value | Read |
|---|---|---|
| Organic keywords ranking | 4 | new-site territory |
| Top position | #48 (`cash proof`) | off the main results |
| Estimated organic traffic | 0/mo | no page-1 rankings yet |

The 4 keywords Shepi ranks for today are all positions 48–81 — off the first page. That's not a page-quality problem (the pages are strong); it's an **authority / age** problem. New sites usually start ranking after a few months of consistent publishing + external links.

### Keyword landscape (worth targeting, low difficulty)

| Keyword | Volume/mo | KDI | Current Shepi page |
|---|---|---|---|
| quality of earnings | 1,600 | 29 (easy) | `/guides/quality-of-earnings` |
| quality of earnings report | 720 | 18 (easy) | `/guides/qoe-report-template` (partial) |
| quality of earnings analysis | 480 | 25 (easy) | `/guides/quality-of-earnings` |
| ebitda adjustments | 210 | 20 (easy) | `/guides/ebitda-adjustments` |
| ebitda add backs | 210 | 15 (easy) | `/guides/ebitda-adjustments` |
| working capital peg | 170 | 10 (very easy) | `/guides/working-capital-analysis` |
| quality of earnings cost | 20 | 0 (very easy) | `/quality-of-earnings-cost` |
| sell side qoe | 20 | 0 (very easy) | `/guides/sell-side-vs-buy-side-qoe` |

**Read:** All target KDIs are 10–29. This is a very winnable landscape — no dominant incumbent. The path in is authority (backlinks + time), not more content.

### Concrete SEO next steps (in priority order)

1. **Publish + submit sitemap to Google Search Console.** Confirm `https://shepi.ai/sitemap.xml` is submitted and pages are indexed. Rescan any URL stuck at "Discovered — not indexed."
2. **Add HowTo schema** to `/guides/qoe-report-template` and `/guides/due-diligence-checklist` — these two pages match Google's HowTo rich-result eligibility and can win featured snippets even at low DR.
3. **Add SoftwareApplication schema** sitewide (or on `/pricing` and `/quality-of-earnings-software`) — required for AI answer engines to cite you as a *tool* (not just an article).
4. **Get 3–5 real backlinks** from M&A / searcher communities (see Part B, section 3). This is the single biggest lever.
5. **Do not add more guides yet.** You have 20+; publishing more before the existing ones rank dilutes crawl budget. Revisit after 90 days of Search Console data.

---

## Part B — Directory & platform submissions

Three tiers, ordered by ROI. Copy-paste the drafts below.

### 1. Official AI-platform directories (highest ROI)

These are the only routes today for ChatGPT/Claude to *actively suggest* Shepi to a user who hasn't heard of you.

#### OpenAI Apps SDK / ChatGPT Apps directory

- **Submit at:** https://platform.openai.com/docs/apps (Apps SDK submission form, currently invite-based — join the waitlist and reference existing MCP endpoint)
- **What they need:** MCP server URL, OAuth, tool manifest, at least one widget, privacy policy, terms.
- **Shepi status:** ✅ ready — you have `chatgpt-mcp` endpoint with OAuth 2.1 + PKCE + DCR, project-summary widget, `/privacy`, `/terms`.

**Submission copy (paste into the form):**

```
Name: Shepi
Category: Finance / Productivity
One-liner: AI-assisted Quality of Earnings analysis for M&A due diligence.

Description (150 words):
Shepi is an AI-assisted Quality of Earnings (QoE) platform for small and
lower-middle-market M&A. Independent searchers, PE associates, CPA firms,
and SBA lenders use Shepi to run structured financial due diligence —
EBITDA add-back identification, working capital peg analysis, cash-proof
procedures, and lender-ready QoE workpapers — for $2,000 per project
instead of the $20K–$100K a traditional CPA engagement costs.

Shepi is analyst-in-the-loop: every adjustment is human-reviewed. It
does not issue CPA attestations or replace professional judgment.

Through the ChatGPT app, users can list their Shepi projects, pull QoE
summaries, inspect individual adjustments, and export deliverables —
all scoped to their own account via Supabase RLS.

MCP endpoint: https://mdgmessqbfebrbvjtndz.supabase.co/functions/v1/chatgpt-mcp
Homepage:     https://shepi.ai
Setup guide:  https://shepi.ai/connect
Privacy:      https://shepi.ai/privacy
Terms:        https://shepi.ai/terms

Suggested prompts to seed:
  - "List my Shepi projects"
  - "Show the QoE summary for project [ID]"
  - "What are the top EBITDA adjustments in project [ID]?"
  - "Export the QoE workbook for project [ID]"
```

#### Anthropic Claude connector directory

- **Submit at:** https://www.anthropic.com/partners (partner form) and https://github.com/modelcontextprotocol/servers (community MCP registry PR).
- **Shepi status:** ✅ ready — `mcp` endpoint (Claude/general), OAuth 2.1, DCR.

**Submission copy (partner form + PR description):**

```
Name: Shepi
Type: MCP server (remote, OAuth 2.1)
URL: https://mdgmessqbfebrbvjtndz.supabase.co/functions/v1/mcp
Discovery: https://shepi.ai/mcp.json
Category: Finance, M&A, Due Diligence

Summary:
Remote MCP server for Shepi's Quality of Earnings platform. Claude can
list a user's QoE projects, retrieve adjustment detail, and export
workbook data. Auth is OAuth 2.1 with PKCE + Dynamic Client Registration
so no manual client-ID setup is required. RLS-scoped per user.

Tools exposed:
  - list_projects, get_project_summary, get_qoe_summary
  - list_adjustments, get_adjustment_detail, update_adjustment_status
  - list_documents, get_export_data, create_project, echo
```

#### Perplexity / Poe / other MCP registries

- **modelcontextprotocol/servers GitHub** — the de facto community index. Same PR as Claude above.
- **mcp.so** — community directory, self-serve submit at https://mcp.so/submit.
- **Smithery (smithery.ai)** — MCP hosting/discovery, self-serve.

Use the Anthropic copy block above for all three.

---

### 2. AI-answer training-data pushes (medium ROI)

These get Shepi content into the pools ChatGPT/Claude/Perplexity draw from when there's no active tool call.

- **Wikipedia** — do NOT create a Shepi page (will be deleted for notability). Instead, edit the existing **"Quality of Earnings"** article to add one sourced sentence about AI-assisted QoE workflows, citing an independent third-party article (not shepi.ai). This is the highest-leverage single edit possible.
- **G2 / Capterra / GetApp** — create free listings under *"M&A software"* and *"Due Diligence software"*. These pages rank on Google for tool comparisons and are scraped by every LLM.
- **Product Hunt launch** — one-shot; drives 20–100 backlinks and gets indexed by Perplexity within days.
- **AlternativeTo.net** — add Shepi as an alternative to "Datasite", "Intralinks", "DealRoom". LLMs cite AlternativeTo constantly for "alternatives to X" queries.

---

### 3. Community backlinks (highest SEO lever)

These are the citations that move Semrush Authority Score and unlock the KDI 15–30 rankings above.

- **SearchFunder.com** — the independent-searcher community. Write one guest post: *"How much should a searcher pay for QoE?"* Link to `/quality-of-earnings-cost`.
- **Acquiring Minds podcast** — pitch Will Smith. QoE cost is a recurring audience pain point.
- **r/smallbusiness, r/sba, r/Entrepreneur** — answer real QoE questions with a link to the relevant guide (not the homepage). Reddit is now heavily weighted in Google + cited directly by ChatGPT.
- **BizBuySell + Axial blogs** — pitch a guest article on EBITDA add-backs.
- **HARO / Qwoted / Featured.com** — respond to journalist queries tagged *M&A*, *small business acquisition*, *SBA lending*. One TechCrunch/Inc./Forbes mention = ~5 points of Authority Score.

---

## Honest expectation setting

- **Directory submissions (Part B.1)**: 2–6 weeks to show up in ChatGPT/Claude app pickers.
- **Wikipedia + G2 + AlternativeTo (Part B.2)**: LLMs pick these up within 30–60 days on their next training refresh; Perplexity within days.
- **Google organic rankings**: 3–6 months of consistent backlinks before the KDI 15–30 keywords above start ranking on page 1. Nothing you can code will accelerate this — it's an authority signal Google gates by time.

The pages are ready. The distribution work is what's left.
