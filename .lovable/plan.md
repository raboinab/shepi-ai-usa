## Goal

Reduce paragraph density on Home, Resources, and Pricing by pairing prose with **custom SVG illustrated diagrams** in the existing serif/analytical brand voice. No stock photos, no product screenshots in this pass.

## Visual approach

- Custom inline **React SVG illustrations** (not raster images) using existing design tokens (`--primary`, `--secondary`, `--accent`, `--muted`). Keeps them dark/light-mode safe, sharp on retina, and zero asset weight.
- One shared style: thin strokes, cream fills, subtle Shepi-blue accents, occasional serif labels — matches the current Lora/Inter pairing.
- Each illustration communicates a concept (workflow, reconciliation chain, tier ladder, guide category), not decoration.

## Scope

### 1. Homepage (`src/pages/Index.tsx`)
- **Hero:** add a right-column `WorkflowDiagram` SVG (Upload → Extract → Balance → Report), replacing the current text-only hero balance.
- **How it works section:** convert the 3-column text block into a `ReconciliationChain` diagram (Tax Return → P&L → GL → TB) with tight captions instead of paragraphs.
- **Tier comparison:** replace the DIY vs DFY paragraphs with a `TierLadder` illustration (two stacked cards with icon markers for what's included).
- **Trim** existing paragraph copy by ~30% where the diagram now carries the meaning. Keep the FAQ, keep CPA-attestation disclaimers verbatim (memory constraint).

### 2. Resources (`src/pages/Resources.tsx`)
- Rebuild the guides list as a **card grid with illustrated thumbnails** (per user choice).
- 5–6 reusable category illustrations (EBITDA, Working Capital, Red Flags, AI/QoE, Comparison, Checklist) — each guide card picks one based on category tag.
- Cards: illustration top (aspect-ratio 16:9), title, one-line description, "Read guide" affordance. No excerpt paragraphs on the index.
- Add a lightweight **category filter row** above the grid (All / EBITDA / Diligence / AI / Comparison).

### 3. Pricing (`src/pages/Pricing.tsx`)
- Add a `TierLadder` illustration at the top comparing Self-Service vs Done-For-You visually (feature dots per tier).
- Convert the "What's included" bullet lists into a **checked comparison table** with icon markers instead of long bullet paragraphs.
- Keep DIY positioning language exactly as memory requires ("seller-prepared, no CPA review").

## New shared components

```
src/components/illustrations/
  WorkflowDiagram.tsx        // hero: 4-step arrow flow
  ReconciliationChain.tsx    // tax return → P&L → GL → TB
  TierLadder.tsx             // DIY vs DFY visual
  GuideThumbnail.tsx         // takes category prop, renders matching SVG
  category-svgs/             // 6 small SVG concept illustrations
```

All pure SVG, styled with Tailwind + CSS variables. No new dependencies.

## Constraints honored

- CPA/attestation language on Home FAQ untouched.
- DIY = "seller-prepared, no CPA review" language preserved on Pricing.
- No new fonts, no new color tokens — uses existing Shepi palette only.
- No product screenshots (user chose illustrations).

## Out of scope

- Photography, generated raster art, animated video.
- Copy rewriting beyond trimming redundant paragraphs where the diagram replaces them.
- Guide detail pages (only the Resources index changes).
- Nav/footer changes.

## Verification

- `bun run build` passes.
- Playwright screenshot of `/`, `/resources`, `/pricing` at 1280px and mobile 375px — visually confirm the diagrams render, layout doesn't shift, and text is legible in both light and dark mode.
