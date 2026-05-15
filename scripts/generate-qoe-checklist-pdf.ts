/**
 * Generate /public/qoe-checklist.pdf — the downloadable companion to
 * /quality-of-earnings-checklist. Plain text + checkbox glyphs, branded
 * header/footer, A4 + Letter compatible (Letter sized).
 *
 * Regen: `bun run scripts/generate-qoe-checklist-pdf.ts`
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFileSync } from "fs";

type Section = { title: string; intro?: string; items: string[] };

const SECTIONS: Section[] = [
  {
    title: "1. Data Request",
    intro: "Collect 3 years + TTM. Missing data is the #1 cause of QoE delays.",
    items: [
      "Trial balances — 3 years plus TTM (monthly preferred)",
      "General ledger — full detail for the same periods",
      "Bank statements — all operating accounts for proof of cash",
      "AR aging — current and 12-month historical snapshots",
      "AP aging — current and 12-month historical snapshots",
      "Payroll register — for owner comp normalization",
      "Customer revenue detail — for concentration analysis",
      "Vendor spend detail — for related-party identification",
      "Tax returns — 3 years for book-to-tax reconciliation",
      "Loan agreements & lease schedules",
      "Capex history — to normalize maintenance vs growth",
    ],
  },
  {
    title: "2. Revenue Quality",
    intro: "Test whether revenue is recurring, properly recognized, and well-diversified.",
    items: [
      "Recognition policy review — earned vs billed vs collected",
      "Recurring vs non-recurring classification per stream",
      "Customer concentration: top 10 % of revenue, 3-year trend",
      "Pricing vs volume decomposition of growth",
      "AR aging buckets and collectability of >90 day balances",
      "Channel & geography mix shifts",
    ],
  },
  {
    title: "3. EBITDA Adjustments",
    intro: "Standard add-back categories. Owner comp normalization is usually the largest line.",
    items: [
      "Owner compensation normalization (above/below market)",
      "Personal expenses run through the business",
      "Non-recurring revenue (one-time projects, COVID grants)",
      "Non-recurring expenses (legal settlements, restructuring)",
      "Related-party transactions at non-market terms",
      "Run-rate adjustments for new contracts and lost customers",
      "Accounting cleanup (out-of-period entries, accruals)",
      "Stock-based compensation",
      "Rent normalization (owner-occupied real estate)",
    ],
  },
  {
    title: "4. Working Capital",
    intro: "Drives the dollar-for-dollar purchase price adjustment at close.",
    items: [
      "Trailing 12-month monthly NWC schedule",
      "DSO, DPO, DIO turnover trends",
      "Seasonality identification and normalization",
      "Peg calculation for the purchase agreement",
      "Treatment of cash, debt-like items, deferred revenue",
    ],
  },
  {
    title: "5. Proof of Cash",
    intro: "Where commingled expenses and unrecorded liabilities surface.",
    items: [
      "Reconcile total bank deposits to GL revenue + other receipts",
      "Reconcile total disbursements to GL expenses + other payments",
      "Identify unrecorded liabilities (checks not yet posted)",
      "Identify commingled personal expenses",
      "Verify intercompany / related-party transfer treatment",
      "Confirm period-end cut-off accuracy",
    ],
  },
  {
    title: "6. General Ledger Review",
    intro: "Run each test across 100% of GL transactions, not a sample.",
    items: [
      "Round-dollar transactions",
      "Period-end clustering of entries",
      "Duplicate detection (vendor + amount + date)",
      "Unusual manual entries to revenue, COGS, accruals",
      "Transactions over materiality threshold",
      "Account-level activity drift year-over-year",
    ],
  },
  {
    title: "7. Risk Flags",
    intro: "Qualitative findings that drive R&W insurance, escrow, and indemnity terms.",
    items: [
      "Customer concentration over 20% of revenue",
      "Vendor concentration creating supply risk",
      "Key person / employee dependency",
      "Recent loss of major customer or contract",
      "Outstanding litigation or regulatory issues",
      "Tax exposure (sales tax nexus, payroll tax)",
      "Going-concern indicators",
      "Quality of accounting controls",
    ],
  },
  {
    title: "8. Final Deliverables",
    intro: "What the lender, buyer, and IC actually read.",
    items: [
      "QoE report (PDF, lender-ready)",
      "Adjusted EBITDA bridge (Excel)",
      "Working capital schedule (Excel)",
      "Proof of cash reconciliation (Excel)",
      "Customer concentration analysis",
      "Flagged transactions with audit trail",
      "Full Excel workbook for buyer/lender review",
    ],
  },
];

async function main() {
  const doc = await PDFDocument.create();
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const W = 612; // Letter
  const H = 792;
  const MARGIN_X = 54;
  const MARGIN_TOP = 64;
  const MARGIN_BOTTOM = 56;
  const NAVY = rgb(0.06, 0.13, 0.27);
  const TEAL = rgb(0.18, 0.55, 0.55);
  const TEXT = rgb(0.12, 0.12, 0.14);
  const MUTED = rgb(0.42, 0.42, 0.46);

  let page = doc.addPage([W, H]);
  let y = H - MARGIN_TOP;

  const drawHeader = (p: typeof page) => {
    p.drawText("Shepi", {
      x: MARGIN_X, y: H - 36, size: 14, font: helvBold, color: NAVY,
    });
    p.drawText("Quality of Earnings Checklist", {
      x: MARGIN_X + 50, y: H - 36, size: 11, font: helv, color: MUTED,
    });
    p.drawLine({
      start: { x: MARGIN_X, y: H - 44 },
      end: { x: W - MARGIN_X, y: H - 44 },
      thickness: 0.5, color: TEAL,
    });
  };

  const drawFooter = (p: typeof page, pageNum: number, total: number) => {
    p.drawText("shepi.ai/quality-of-earnings-checklist", {
      x: MARGIN_X, y: 32, size: 9, font: helv, color: MUTED,
    });
    p.drawText(`Page ${pageNum} of ${total}`, {
      x: W - MARGIN_X - 70, y: 32, size: 9, font: helv, color: MUTED,
    });
  };

  drawHeader(page);

  // Cover title block
  page.drawText("Quality of Earnings Checklist", {
    x: MARGIN_X, y, size: 22, font: helvBold, color: NAVY,
  });
  y -= 28;
  page.drawText("8-Section M&A Due Diligence Guide", {
    x: MARGIN_X, y, size: 13, font: helv, color: MUTED,
  });
  y -= 28;
  const subtitle = "Use this checklist to run a complete Quality of Earnings analysis on a lower middle market acquisition. Each section mirrors the online guide at shepi.ai.";
  y = wrapText(page, subtitle, MARGIN_X, y, W - 2 * MARGIN_X, 10.5, helv, TEXT, 14);
  y -= 18;

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN_BOTTOM + 20) {
      page = doc.addPage([W, H]);
      drawHeader(page);
      y = H - MARGIN_TOP;
    }
  };

  for (const s of SECTIONS) {
    ensureSpace(60);
    page.drawText(s.title, {
      x: MARGIN_X, y, size: 14, font: helvBold, color: NAVY,
    });
    y -= 18;
    if (s.intro) {
      y = wrapText(page, s.intro, MARGIN_X, y, W - 2 * MARGIN_X, 10, helv, MUTED, 13);
      y -= 6;
    }
    for (const item of s.items) {
      ensureSpace(18);
      // Checkbox aligned with text baseline (text x-height)
      page.drawRectangle({
        x: MARGIN_X, y: y - 1, width: 9, height: 9,
        borderColor: NAVY, borderWidth: 0.8,
      });
      y = wrapText(page, item, MARGIN_X + 16, y, W - 2 * MARGIN_X - 16, 10.5, helv, TEXT, 14);
      y -= 4;
    }
    y -= 12;
  }

  // Footer pass
  const pages = doc.getPages();
  pages.forEach((p, i) => drawFooter(p, i + 1, pages.length));

  const bytes = await doc.save();
  writeFileSync("public/qoe-checklist.pdf", bytes);
  console.log(`Wrote public/qoe-checklist.pdf — ${pages.length} pages, ${bytes.length} bytes`);
}

/** Word-wrap text and return new y. */
function wrapText(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  font: Parameters<typeof page.drawText>[1] extends { font?: infer F } ? F : never,
  color: ReturnType<typeof rgb>,
  lineHeight: number,
): number {
  const words = text.split(/\s+/);
  let line = "";
  let curY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    // @ts-expect-error font has widthOfTextAtSize
    const width = font.widthOfTextAtSize(test, size);
    if (width > maxWidth && line) {
      page.drawText(line, { x, y: curY, size, font, color });
      curY -= lineHeight;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    page.drawText(line, { x, y: curY, size, font, color });
    curY -= lineHeight;
  }
  return curY;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
