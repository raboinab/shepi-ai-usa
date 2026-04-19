// src/lib/adjustmentsGuideContent.ts
// Pure content library + types + reducer for the Adjustments Guide Sidebar

export type SectionKey = "3-1" | "3-2" | "3-3";
export type Mode = "ledger" | "ai-discovery";
export type FocusedControl =
  | "intent"
  | "tbAccount"
  | "periodValues"
  | "status"
  | "verify"
  | "proof";

export interface GuideContext {
  sectionKey: SectionKey;
  mode?: Mode;
  focusedControl?: FocusedControl;
  expandedCardId?: string | null;
  hasData?: boolean;
  hasAIFlags?: boolean;
}

// ── Reducer ──────────────────────────────────────────────────────────

export type GuideAction =
  | { type: "setSection"; sectionKey: SectionKey }
  | { type: "merge"; patch: Partial<GuideContext> }
  | { type: "clearFocus" };

export function guideReducer(state: GuideContext, action: GuideAction): GuideContext {
  switch (action.type) {
    case "setSection":
      return {
        sectionKey: action.sectionKey,
        mode: undefined,
        focusedControl: undefined,
        expandedCardId: null,
        hasData: undefined,
        hasAIFlags: undefined,
      };
    case "clearFocus":
      return { ...state, focusedControl: undefined };
    case "merge": {
      const next = { ...state, ...action.patch };
      if (action.patch.sectionKey && action.patch.sectionKey !== state.sectionKey) {
        next.focusedControl = undefined;
        next.expandedCardId = null;
      }
      return next;
    }
    default:
      return state;
  }
}

// ── Content types ────────────────────────────────────────────────────

export interface DecisionTreeItem {
  question: string;
  answer: string;
  navigateTo?: { phase: number; section: number };
}

export interface GuideStepGroup {
  title: string;
  steps: string[];
}

export interface GuideExample {
  title: string;
  scenario: string;
  action: string;
}

export interface IntentRow {
  intent: string;
  ebitdaImpact: string;
}

export interface GuideContentSection {
  title: string;
  decisionTree: DecisionTreeItem[];
  what: string;
  howToUse: GuideStepGroup[];
  keyTerms: { term: string; definition: string }[];
  examples: GuideExample[];
  intentTable?: IntentRow[];
  suggestedPrompts: string[];
  emptyStateHint?: string;
  modeOverrides?: Partial<Record<Mode, Partial<GuideContentSection>>>;
}

export interface ContextualHint {
  title: string;
  content: string;
}

// ── Contextual hints ─────────────────────────────────────────────────

export const contextualHints: Record<FocusedControl, ContextualHint> = {
  intent: {
    title: "Choosing the right effect",
    content:
      "Pick the intent that matches what you're doing to earnings. The intent determines the EBITDA direction — see the reference table below.",
  },
  tbAccount: {
    title: "Link to Trial Balance account",
    content:
      "Choose the TB account that matches this activity so Shepi can track where the adjustment lands and keep schedules consistent.",
  },
  periodValues: {
    title: "Entering monthly values",
    content:
      "Enter amounts by month. The total is computed automatically. Use zeros for months where the item didn't occur.",
  },
  status: {
    title: "Status workflow",
    content:
      "Proposed = under review. Accepted = included in normalized results. Rejected = excluded (kept for audit trail).",
  },
  verify: {
    title: "Verify with AI",
    content:
      "Verify cross-checks your adjustment against linked evidence and uploaded deal docs to reduce mistakes and strengthen support.",
  },
  proof: {
    title: "Attach proof",
    content:
      "Upload or link supporting documents (invoice, statement, email, contract) so reviewers can validate the adjustment quickly.",
  },
};

// ── Shared glossary ──────────────────────────────────────────────────

const commonKeyTerms: { term: string; definition: string }[] = [
  { term: "EBITDA", definition: "Earnings Before Interest, Taxes, Depreciation & Amortization — a common measure of operating performance used in deals." },
  { term: "Add-back", definition: "Removing an expense to increase EBITDA and show ongoing earnings power." },
  { term: "Normalization", definition: "Adjusting an item to a market or steady-state level (e.g., owner comp, rent) to reflect a buyer's reality." },
  { term: "Non-recurring", definition: "A one-time item not expected to repeat under normal operations (e.g., lawsuit settlement)." },
  { term: "Pro Forma", definition: '"As if" earnings — what results would look like after a future change (e.g., new lease terms).' },
  { term: "Run-rate", definition: "A normalized, steady-state level of revenue/cost used to estimate ongoing performance." },
];

// ── Shared decision tree ─────────────────────────────────────────────

const sharedDecisionTree: DecisionTreeItem[] = [
  { question: "Am I changing EBITDA?", answer: "Yes → DD Adjustments", navigateTo: { phase: 3, section: 1 } },
  { question: "Am I changing EBITDA?", answer: "No → Reclassifications", navigateTo: { phase: 3, section: 2 } },
  { question: "Investigating raw entries?", answer: "Journal Entries", navigateTo: { phase: 3, section: 3 } },
];

// ── Section content ──────────────────────────────────────────────────

export const adjustmentsGuideContent: Record<SectionKey, GuideContentSection> = {
  "3-1": {
    title: "DD Adjustments",
    decisionTree: sharedDecisionTree,
    what: "Adjustments correct earnings to show what a buyer would actually earn. You remove one-time items, normalize owner perks, and account for post-deal changes so normalized EBITDA reflects reality.",
    howToUse: [
      {
        title: "Using the Adjustment Ledger",
        steps: [
          'Click "From template..." to pre-fill common adjustments (e.g., owner comp normalization).',
          'Or click "Add DD Adjustment" for a blank entry.',
          "Expand the row and fill in Description, TB Account, Effect (Intent), and monthly values.",
          "Add Evidence/Notes so a reviewer can validate quickly.",
          "Set Status to Proposed / Accepted / Rejected.",
          "Use Verify and Attach Proof to strengthen support.",
        ],
      },
      {
        title: "Types of adjustments",
        steps: [
          "MA (Management): owner-related or discretionary items (e.g., personal car, family payroll).",
          "DD (Due Diligence): one-time items uncovered during review (e.g., settled lawsuit).",
          "PF (Pro Forma): future changes expected after close (e.g., new lease savings).",
        ],
      },
    ],
    keyTerms: commonKeyTerms,
    examples: [
      { title: "Owner's personal car lease", scenario: "The company pays $10k/month for the owner's personal vehicle.", action: "Create an MA adjustment and remove the expense (+EBITDA). Attach the lease statement." },
      { title: "One-time legal settlement", scenario: "A $50k legal settlement was paid and the matter is resolved.", action: "Create a DD adjustment and remove the one-time expense (+EBITDA). Attach the settlement proof." },
      { title: "New lease savings post-close", scenario: "A signed lease amendment will reduce rent by $3k/month.", action: "Create a PF adjustment reflecting future savings (+EBITDA). Attach the signed amendment." },
    ],
    intentTable: [
      { intent: "Remove one-time expense", ebitdaImpact: "+EBITDA" },
      { intent: "Add missing expense", ebitdaImpact: "-EBITDA" },
      { intent: "Remove non-recurring revenue", ebitdaImpact: "-EBITDA" },
      { intent: "Add missing revenue", ebitdaImpact: "+EBITDA" },
      { intent: "Normalize expense upward", ebitdaImpact: "-EBITDA" },
      { intent: "Normalize expense downward", ebitdaImpact: "+EBITDA" },
    ],
    suggestedPrompts: [
      "What common adjustments should I look for in this industry?",
      "Is this owner compensation reasonable vs market?",
      "Help me decide whether this is MA, DD, or PF.",
      "Does this look non-recurring or run-rate?",
    ],
    emptyStateHint: 'Not sure where to start? Try AI Discovery or choose a template from "From template...".',
    modeOverrides: {
      "ai-discovery": {
        howToUse: [
          {
            title: "Using AI Discovery",
            steps: [
              'Switch to the "AI Discovery" tab to review automatically flagged items.',
              "Click a flag to see why it was flagged (timing, amount, vendor/memo patterns).",
              'Click "Convert" to create an adjustment — Shepi pre-fills account, amount, and effect.',
              "Review the created adjustment in the Ledger tab, refine values, and attach proof.",
            ],
          },
        ],
        suggestedPrompts: [
          "Why was this transaction flagged as unusual?",
          "Should this be an add-back or a reclass?",
          "What evidence would best support this adjustment?",
        ],
      },
    },
  },

  "3-2": {
    title: "Reclassifications",
    decisionTree: sharedDecisionTree,
    what: "Reclassifications move amounts between financial statement categories without changing total profit. They do not change EBITDA, but can change Gross Profit / Gross Margin presentation (e.g., moving shipping from G&A to COGS).",
    howToUse: [
      {
        title: "How to reclassify",
        steps: [
          'Click "Add Entry".',
          "Enter Account # and Account Description.",
          "Select the From FS line item (where it currently sits).",
          "Select the To FS line item (where it should be).",
          "Enter the amount to move.",
          "Add a reason so reviewers understand the logic.",
        ],
      },
      {
        title: "Reclass vs Adjust",
        steps: [
          "Adjust (DD Adjustments): when EBITDA should change.",
          "Reclass (this page): when EBITDA should not change — you're fixing categorization for clarity.",
        ],
      },
    ],
    keyTerms: commonKeyTerms,
    examples: [
      { title: "Shipping costs in G&A", scenario: "The company records $8k/month shipping under G&A.", action: "Reclass from G&A to COGS. EBITDA stays the same, but gross margin becomes accurate." },
    ],
    suggestedPrompts: [
      "Which accounts might be miscategorized?",
      "Should this expense be COGS or OpEx?",
      "Does this belong in revenue contra accounts or expense?",
    ],
    emptyStateHint: "Not sure what to reclass? Ask the AI which accounts might be miscategorized.",
    modeOverrides: {
      "ai-discovery": {
        howToUse: [
          {
            title: "Using AI Discovery for reclasses",
            steps: [
              "Review suggested reclasses based on vendor/memo patterns and account behavior.",
              "Confirm the direction (From → To) matches the business logic.",
              "Apply the reclass and document the reason.",
            ],
          },
        ],
      },
    },
  },

  "3-3": {
    title: "Journal Entries",
    decisionTree: sharedDecisionTree,
    what: "Journal Entries are the raw accounting records. This read-only view helps you spot unusual patterns like large period-end entries, round numbers, or adjustments that don't match operations.",
    howToUse: [
      {
        title: "How to review journal entries",
        steps: [
          "Use search to filter by account, memo, or JE number.",
          "Expand a row to see debit/credit line details.",
          "Look for unusual entries (timing, size, or memo).",
          "If something affects normalized earnings, create a DD Adjustment for it.",
        ],
      },
      {
        title: "What to look for",
        steps: [
          "Large entries near month-end or year-end.",
          "Round numbers (e.g., exactly $100,000).",
          'Entries marked "Adj" or posted by accountants near close.',
          "Unusual revenue or COGS entries that don't align to operations.",
        ],
      },
    ],
    keyTerms: commonKeyTerms,
    examples: [
      { title: "Large year-end entry", scenario: "A large adjusting entry posted on the last day of the fiscal year impacts revenue.", action: "Investigate support. If non-recurring or unsupported, create a DD adjustment and attach evidence." },
    ],
    suggestedPrompts: [
      "Which journal entries look like period-end adjustments?",
      "Are there entries that could indicate earnings management?",
      "What evidence would validate this journal entry?",
    ],
    emptyStateHint: "Journal entries will appear after a QuickBooks sync. Check your integration status if you expected to see them.",
  },
};

// ── Policy function: which accordion items to open by default ─────────

export type AccordionKey = "what" | "how" | "terms" | "examples" | "ask";

export function getDefaultOpenItems(ctx: GuideContext): AccordionKey[] {
  if (ctx.mode === "ai-discovery") return ["how"];
  if (ctx.hasData === false) return ["how", "examples"];
  if (ctx.focusedControl) return ["how"];
  return ["what", "how"];
}
