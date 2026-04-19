

# SEO Keyword Optimization (Meta Tags and Structured Data Only)

No visible homepage content will be changed. The H1, hero layout, and all on-page copy remain exactly as they are.

## Changes

### 1. index.html -- Static meta tags

Update the hardcoded tags that Google sees before JS executes:

- **Title**: "Shepi | AI Assisted Quality of Earnings Analysis for M&A Professionals" --> "AI Quality of Earnings Software | QoE Analysis Platform | Shepi"
- **Meta description**: Update to include exact-match phrases "AI quality of earnings" and "quality of earnings AI"
- **og:title / twitter:title**: Match the new title
- **og:description / twitter:description**: Match the new description
- **Keywords meta**: Add "quality of earnings AI, AI quality of earnings"

### 2. src/pages/Index.tsx -- useSEO call

Update the dynamic `useSEO` hook values to match the new index.html tags:
- `title`: "AI Quality of Earnings Software | QoE Analysis Platform | Shepi"
- `description`: "AI quality of earnings analysis for M&A due diligence. Upload financials, get EBITDA adjustments and lender-ready QoE reports in hours. Quality of earnings AI built for deal teams, PE firms, and searchers."

### 3. src/pages/Index.tsx -- JSON-LD structured data

Update the `softwareSchema` object:
- `name`: "Shepi" --> "Shepi -- AI Quality of Earnings Software"
- `description`: Include "AI quality of earnings" and "quality of earnings AI" phrases

### 4. src/pages/features/QoESoftware.tsx -- SEO title and description

- `seoTitle`: "QoE Software -- AI Quality of Earnings Tool for M&A | Shepi" --> "Quality of Earnings AI Software | AI QoE Analysis Tool | Shepi"
- `seoDescription`: Update to lead with "Quality of Earnings AI software" phrasing

### 5. src/hooks/useSEO.ts -- Cleanup title

Update the unmount fallback title from "Shepi | AI Assisted Quality of Earnings Analysis for M&A Professionals" to "AI Quality of Earnings Software | QoE Analysis Platform | Shepi" so it stays consistent.

## What stays the same

- Homepage H1 ("AI-Assisted / Quality of Earnings Analysis") -- untouched
- All visible page content, layout, and styling -- untouched
- All other pages' SEO -- untouched
