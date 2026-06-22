# Plan: Reposition DIY as a DFY Lead-In (Not Lender-Grade)

## The reframe

DIY at $1,000 is no longer pitched as "a QoE." It's pitched as **deal prep / peace of mind**: it gets your data room into recon-tied shape so a buyer, a buyer's CPA, or a lender can actually work with it. Most lenders won't lean on a self-prepared report for a financing decision, so we stop implying they will.

DFY remains the bankable product. DIY's job is to (a) be useful on its own to a seller who just wants to know what they have, and (b) be the cheapest, lowest-friction door into DFY.

## What changes in the product (no code yet — this is the positioning + UX plan)

### 1. Honest DIY framing everywhere it appears
- Marketing pages, pricing page, checkout, and the DIY deliverable cover page all say the same thing in plain language: **"Seller-prepared diligence package. Not a CPA-issued QoE. Most lenders will require a third-party CPA review (DFY) before funding."**
- Remove any copy that implies DIY output is interchangeable with DFY output. Same deliverable structure, different attestation status — and we say that out loud.
- Keep the "your buyer's CPA can work from this" line — that's true and useful.

### 2. DIY as DFY lead-in: the upgrade path
- Inside the DIY project, a persistent **"Upgrade to DFY"** affordance (sidebar card + post-export CTA) that:
  - Shows the DFY price
  - Credits the $1,000 DIY fee against DFY (so DIY → DFY costs the same as buying DFY directly)
  - Carries the entire data room, recon state, adjustments, and exports forward — no re-upload, no re-mapping
- A DFY upgrade does not reset the wizard. It assigns a CPA, opens the review queue against the existing recon chain, and unlocks the DFY-only deliverable variant (CPA-reviewed cover page, signed adjustments memo).

### 3. Deliverable differentiation (same skeleton, different label)
- **DIY cover page:** "Seller-prepared. No CPA review. For peace of mind and buyer/lender intake."
- **DFY cover page:** "Reviewed by [CPA name], [firm/credential]. Adjustments confirmed accurate." (Per existing memory: review, not attestation.)
- Both PDFs are structurally identical (recon summary, adjustments, tie-outs, provenance). Lenders that *do* accept seller-prepared packages get a clean one; lenders that don't get a clear upgrade path.

### 4. Pricing (locked from prior decisions, restated here)
- **DIY: $1,000** — credited toward DFY if upgraded within the project's active window.
- **DFY: $5K–$15K** — unchanged. CPA-led review of the recon chain and adjustments.
- No new tier between them. The "right ceiling" question resolves to: DIY stays at $1K because its value is *prep + optionality on upgrade*, not the report itself.

### 5. Tax-returns-first path (carryover from prior plan, unchanged)
- Returns-first intake remains the default for sub-$10M deals.
- Recon chain (Return → GL → Bank+CC → AR/AP → Stub) is the spine of both DIY and DFY. DFY adds CPA sign-off on each layer; DIY shows the same green/yellow/red tie-out badges but unsigned.

## What this displaces

- Old DIY marketing copy that positioned the output as a QoE substitute.
- Any "DIY produces the same thing as DFY" language — replaced with "same structure, different attestation."
- The implicit assumption that DIY is a terminal product. It's now explicitly a step in a funnel, with DFY as the destination for anyone who needs a bankable report.

## Out of scope for this change

- Building the CPA review queue UI (already in roadmap).
- Lender-specific deliverable variants (SBA template, etc.) — separate effort once we know which lenders we're courting.
- Refund/credit mechanics for DIY purchased before this repositioning ships.
- Real-data-room walkthrough — still the next concrete step before locking parser scope; this plan doesn't replace it.

## Open questions to resolve before build

1. **Credit window.** Does the $1,000 DIY credit toward DFY expire? Suggest: credit is good as long as the project is active (no hard deadline), but the underlying data room ages out at 12 months for tax-return relevance.
2. **Who pitches the upgrade?** Automated in-app CTA only, or also a human follow-up from Shepi after DIY export? Suggest: automated first, human follow-up only if the project shows >$3M revenue (worth the sales touch).
3. **DIY → DFY handoff.** When a DIY user upgrades, do they pick the CPA from a roster, or does Shepi assign? Suggest: Shepi assigns based on industry match; user can request a swap.

## Next concrete step

Still the real data-room walkthrough. The repositioning above doesn't depend on it, but parser scope and recon tolerances do. Once a zip lands, the addendum will lock those.
