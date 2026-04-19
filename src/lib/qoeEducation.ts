// QoE Educational Content Mapping
// Maps wizard sections to QoE concepts, educational context, and suggested prompts

export interface SectionEducation {
  sectionKey: string;
  title: string;
  concepts: string[];
  description: string;
  suggestedPrompts: string[];
  keyTerms: { term: string; definition: string }[];
}

export const QOE_SECTION_EDUCATION: Record<string, SectionEducation> = {
  // Phase 1: Project Setup
  "1-1": {
    sectionKey: "company-info",
    title: "Company Information",
    concepts: ["Target Company Profile", "Deal Context", "Industry Analysis"],
    description: "Understanding the target company's background is crucial for contextualizing the QoE analysis. This includes ownership structure, business model, and industry dynamics that may affect earnings quality.",
    suggestedPrompts: [
      "What company information is most important for a QoE analysis?",
      "How does industry affect earnings quality assessment?",
      "What red flags should I look for in company background?",
    ],
    keyTerms: [
      { term: "Target Company", definition: "The business being analyzed for potential acquisition or investment" },
      { term: "Transaction Type", definition: "The nature of the deal (acquisition, merger, investment, etc.)" },
    ],
  },
  "1-2": {
    sectionKey: "due-diligence",
    title: "Due Diligence Information",
    concepts: ["Due Diligence Scope", "Data Room Access", "Management Interviews"],
    description: "Due diligence sets the parameters for the QoE analysis, including time periods covered, data availability, and any limitations that may affect conclusions.",
    suggestedPrompts: [
      "What periods should a QoE analysis typically cover?",
      "What are common due diligence limitations?",
      "How do I document scope limitations in my analysis?",
    ],
    keyTerms: [
      { term: "Scope Limitations", definition: "Constraints on the analysis due to data availability or time restrictions" },
      { term: "Analysis Period", definition: "The fiscal periods being examined in the QoE review" },
    ],
  },

  // Phase 2: Core Data Entry
  "2-1": {
    sectionKey: "chart-of-accounts",
    title: "Chart of Accounts",
    concepts: ["Account Structure", "Account Classification", "Mapping Consistency", "Mapping Validation"],
    description: "The chart of accounts defines how transactions are categorized. Correct account mappings ensure accurate financial statement presentation and EBITDA calculations.",
    suggestedPrompts: [
      "Review my Chart of Accounts for mapping errors",
      "Which accounts might be miscategorized?",
      "Are my revenue and COGS accounts properly classified?",
      "Check if any expense accounts should be Other Income/Expense",
      "Validate my balance sheet account classifications",
    ],
    keyTerms: [
      { term: "Chart of Accounts", definition: "The organized list of all accounts used to record transactions" },
      { term: "Account Classification", definition: "Grouping accounts into categories like revenue, COGS, operating expenses" },
      { term: "FS Line Item", definition: "The standardized financial statement line where an account appears (e.g., Cash, Fixed Assets, Operating Expenses)" },
      { term: "Mapping Validation", definition: "Comparing account classifications against QuickBooks standard mapping rules to identify errors" },
    ],
  },
  "2-2": {
    sectionKey: "trial-balance",
    title: "Trial Balance",
    concepts: ["General Ledger", "Account Mapping", "Period Comparison", "Balance Verification"],
    description: "The trial balance is the foundation of the QoE analysis. It provides the detailed account-level data needed to build adjusted financial statements and identify normalization adjustments.",
    suggestedPrompts: [
      "Is my Trial Balance balanced for all periods?",
      "Which accounts have unusual monthly fluctuations?",
      "Are there any accounts missing from the Chart of Accounts?",
      "What are the largest balance changes month-over-month?",
      "Identify any accounts with potential classification issues",
    ],
    keyTerms: [
      { term: "Trial Balance", definition: "A listing of all general ledger accounts and their balances at a point in time" },
      { term: "Account Mapping", definition: "Categorizing GL accounts into standardized financial statement line items" },
      { term: "Balance Check", definition: "Verification that BS + IS = 0 (debits equal credits)" },
      { term: "Variance Analysis", definition: "Comparing period-over-period changes to identify anomalies" },
    ],
  },
  "2-3": {
    sectionKey: "document-upload",
    title: "Document Upload",
    concepts: ["Source Documentation", "Audit Trail", "Data Validation"],
    description: "Supporting documents provide evidence for adjustments and help validate financial data. Bank statements, invoices, and contracts are critical for substantiating the analysis.",
    suggestedPrompts: [
      "What documents are essential for a QoE analysis?",
      "How do I validate data from uploaded documents?",
      "What if key documents are missing?",
    ],
    keyTerms: [
      { term: "Source Documents", definition: "Original records that support financial transactions" },
      { term: "Proof of Cash", definition: "Reconciliation of book cash to bank statements" },
    ],
  },

  // Phase 3: Adjustments & Schedules
  "3-1": {
    sectionKey: "dd-adjustments",
    title: "DD Adjustments",
    concepts: ["EBITDA Adjustments", "Normalization", "Pro Forma Adjustments", "Run-Rate"],
    description: "Due diligence adjustments normalize EBITDA by removing non-recurring items, related party transactions, and accounting anomalies to show sustainable earnings.",
    suggestedPrompts: [
      "What's the difference between normalization and pro forma adjustments?",
      "What are the most common EBITDA add-backs?",
      "How do I determine if an item is truly non-recurring?",
      "What adjustments do buyers typically push back on?",
    ],
    keyTerms: [
      { term: "EBITDA", definition: "Earnings Before Interest, Taxes, Depreciation, and Amortization" },
      { term: "Normalization", definition: "Adjusting for non-recurring or unusual items to show sustainable earnings" },
      { term: "Add-back", definition: "An expense added back to EBITDA to increase adjusted earnings" },
      { term: "Run-Rate", definition: "Annualized earnings based on recent performance trends" },
    ],
  },
  "3-2": {
    sectionKey: "reclassifications",
    title: "Reclassifications",
    concepts: ["Financial Statement Reclassification", "Above/Below the Line", "COGS vs OpEx"],
    description: "Reclassifications correct the presentation of items on financial statements without changing net income. They ensure proper categorization for EBITDA and margin analysis.",
    suggestedPrompts: [
      "When should I reclassify vs. adjust an item?",
      "What's the impact of reclassifying between COGS and OpEx?",
      "How do reclassifications affect EBITDA?",
    ],
    keyTerms: [
      { term: "Reclassification", definition: "Moving an item from one line to another without changing total earnings" },
      { term: "Above the Line", definition: "Items included in EBITDA calculation (revenue through operating income)" },
    ],
  },
  "3-3": {
    sectionKey: "ar-aging",
    title: "AR Aging",
    concepts: ["Accounts Receivable", "Collectibility", "DSO Analysis", "Bad Debt"],
    description: "AR aging analysis assesses the quality of receivables and potential collection issues. High DSO or aging concentrations may indicate revenue quality concerns.",
    suggestedPrompts: [
      "What AR aging buckets are concerning?",
      "How do I calculate and interpret DSO?",
      "What bad debt reserve is appropriate?",
    ],
    keyTerms: [
      { term: "DSO", definition: "Days Sales Outstanding - measures how quickly receivables are collected" },
      { term: "Aging Bucket", definition: "Categories of receivables based on days past due (current, 30, 60, 90+ days)" },
    ],
  },
  "3-4": {
    sectionKey: "ap-aging",
    title: "AP Aging",
    concepts: ["Accounts Payable", "DPO Analysis", "Vendor Terms", "Cash Management"],
    description: "AP aging reveals payment practices and potential cash flow issues. Stretching payables may inflate working capital artificially.",
    suggestedPrompts: [
      "How does AP aging affect working capital analysis?",
      "What does high DPO indicate?",
      "How do I identify if the company is stretching payables?",
    ],
    keyTerms: [
      { term: "DPO", definition: "Days Payable Outstanding - measures how long it takes to pay vendors" },
      { term: "Trade Payables", definition: "Amounts owed to vendors for goods and services" },
    ],
  },
  "3-5": {
    sectionKey: "fixed-assets",
    title: "Fixed Assets",
    concepts: ["PP&E", "Depreciation", "CapEx Analysis", "Asset Condition"],
    description: "Fixed asset analysis identifies deferred maintenance, unusual depreciation policies, and CapEx requirements that may affect future cash flows.",
    suggestedPrompts: [
      "How do I assess if CapEx has been deferred?",
      "What depreciation methods are most common?",
      "How does fixed asset analysis affect the QoE?",
    ],
    keyTerms: [
      { term: "CapEx", definition: "Capital Expenditures - spending on property, plant, and equipment" },
      { term: "Maintenance CapEx", definition: "Spending required to maintain current operations vs. growth CapEx" },
    ],
  },
  "3-6": {
    sectionKey: "inventory",
    title: "Inventory",
    concepts: ["Inventory Valuation", "DIO Analysis", "Obsolescence", "FIFO/LIFO"],
    description: "Inventory quality analysis identifies slow-moving or obsolete items that may require write-downs and affect gross margins.",
    suggestedPrompts: [
      "How do I identify obsolete inventory?",
      "What inventory metrics should I calculate?",
      "How does inventory method affect earnings?",
    ],
    keyTerms: [
      { term: "DIO", definition: "Days Inventory Outstanding - measures how long inventory is held" },
      { term: "Obsolescence Reserve", definition: "Allowance for inventory that may not be sellable at full value" },
    ],
  },
  "3-7": {
    sectionKey: "payroll",
    title: "Payroll",
    concepts: ["Compensation Analysis", "Owner Compensation", "FTE Analysis", "Benefits"],
    description: "Payroll analysis identifies owner/executive compensation that may need normalization and ensures staffing levels support the business.",
    suggestedPrompts: [
      "How do I normalize owner compensation?",
      "What's a reasonable market salary adjustment?",
      "How do I analyze payroll trends?",
    ],
    keyTerms: [
      { term: "Owner Compensation", definition: "Salary and benefits paid to owners that may exceed or fall below market rates" },
      { term: "FTE", definition: "Full-Time Equivalent - standardized measure of employee headcount" },
    ],
  },
  "3-8": {
    sectionKey: "supplementary",
    title: "Supplementary Schedules",
    concepts: ["Supporting Analysis", "Reconciliations", "Additional Schedules"],
    description: "Supplementary schedules provide additional detail and reconciliations to support the core QoE analysis and address specific deal requirements.",
    suggestedPrompts: [
      "What supplementary schedules are typically needed?",
      "How do I document my analysis methodology?",
      "What reconciliations should I prepare?",
    ],
    keyTerms: [
      { term: "Reconciliation", definition: "Matching two sets of records to verify accuracy" },
      { term: "Supporting Schedule", definition: "Detailed analysis backing up summary figures" },
    ],
  },

  // Phase 4: Customer & Vendor
  "4-1": {
    sectionKey: "top-customers",
    title: "Top Customers",
    concepts: ["Customer Concentration", "Revenue Quality", "Customer Retention"],
    description: "Customer analysis identifies concentration risk and revenue sustainability. High concentration in a few customers represents deal risk.",
    suggestedPrompts: [
      "What level of customer concentration is concerning?",
      "How do I assess customer retention risk?",
      "What customer metrics should I calculate?",
    ],
    keyTerms: [
      { term: "Customer Concentration", definition: "Percentage of revenue from top customers - often flagged if >20% from one customer" },
      { term: "Revenue Quality", definition: "Assessment of whether revenue is recurring, contractual, and sustainable" },
    ],
  },
  "4-2": {
    sectionKey: "top-vendors",
    title: "Top Vendors",
    concepts: ["Vendor Concentration", "Supply Chain Risk", "Related Party Transactions"],
    description: "Vendor analysis identifies supply chain risks and potential related party transactions that may need adjustment or disclosure.",
    suggestedPrompts: [
      "What vendor concentration raises concerns?",
      "How do I identify related party vendors?",
      "What supply chain risks should I flag?",
    ],
    keyTerms: [
      { term: "Vendor Concentration", definition: "Reliance on a small number of suppliers for critical inputs" },
      { term: "Related Party", definition: "Entity with ownership or control relationship to the target" },
    ],
  },

  // Phase 5: Reports (18 sections matching WizardContent.tsx)
  "5-1": {
    sectionKey: "income-statement",
    title: "Income Statement",
    concepts: ["Revenue Recognition", "Gross Margin", "Operating Expenses", "EBITDA Margin"],
    description: "The adjusted income statement shows normalized earnings after all QoE adjustments, providing the basis for valuation and deal pricing.",
    suggestedPrompts: [
      "What drives gross margin changes?",
      "How should I present adjusted vs. reported EBITDA?",
      "What income statement trends are red flags?",
    ],
    keyTerms: [
      { term: "Adjusted EBITDA", definition: "EBITDA after normalization adjustments" },
      { term: "EBITDA Margin", definition: "EBITDA as a percentage of revenue" },
    ],
  },
  "5-2": {
    sectionKey: "is-detailed",
    title: "Income Statement - Detailed",
    concepts: ["Account-Level Detail", "Expense Categorization", "Variance Analysis"],
    description: "The detailed income statement shows account-level breakdowns for each line item, enabling granular analysis of revenue and expense components.",
    suggestedPrompts: [
      "Which accounts are driving revenue changes?",
      "Are there any unusual expense line items?",
      "How do I identify misclassified accounts in the IS?",
    ],
    keyTerms: [
      { term: "Account-Level Detail", definition: "Individual GL account balances that roll up to financial statement line items" },
      { term: "Expense Categorization", definition: "Proper classification of expenses into COGS, OpEx, and other categories" },
    ],
  },
  "5-3": {
    sectionKey: "balance-sheet",
    title: "Balance Sheet",
    concepts: ["Working Capital", "Net Debt", "Off-Balance Sheet Items"],
    description: "The adjusted balance sheet identifies working capital requirements and net debt for deal pricing and post-close cash needs.",
    suggestedPrompts: [
      "How is working capital defined for deals?",
      "What balance sheet items commonly need adjustment?",
      "How do I calculate net debt?",
    ],
    keyTerms: [
      { term: "Net Working Capital", definition: "Current assets minus current liabilities (often excludes cash and debt)" },
      { term: "Net Debt", definition: "Total debt minus cash and cash equivalents" },
    ],
  },
  "5-4": {
    sectionKey: "bs-detailed",
    title: "Balance Sheet - Detailed",
    concepts: ["Asset Detail", "Liability Detail", "Equity Components"],
    description: "The detailed balance sheet shows account-level breakdowns for assets, liabilities, and equity, enabling granular analysis of the company's financial position.",
    suggestedPrompts: [
      "Which asset accounts have unusual balances?",
      "Are there any unrecorded liabilities to watch for?",
      "How do I verify equity account accuracy?",
    ],
    keyTerms: [
      { term: "Asset Detail", definition: "Individual account balances within current and non-current asset categories" },
      { term: "Equity Components", definition: "Retained earnings, contributed capital, and other equity accounts" },
    ],
  },
  "5-5": {
    sectionKey: "is-bs-reconciliation",
    title: "Reconciling IS & BS",
    concepts: ["Net Income Reconciliation", "Retained Earnings Bridge", "Cross-Statement Validation"],
    description: "This QC check ensures that net income from the income statement flows correctly into retained earnings on the balance sheet, catching data integrity issues.",
    suggestedPrompts: [
      "Why doesn't my net income match the change in retained earnings?",
      "What causes IS-to-BS reconciliation differences?",
      "How do dividends affect the reconciliation?",
    ],
    keyTerms: [
      { term: "Retained Earnings Bridge", definition: "Beginning RE + Net Income − Dividends = Ending RE" },
      { term: "Cross-Statement Validation", definition: "Verifying consistency between income statement and balance sheet" },
    ],
  },
  "5-6": {
    sectionKey: "sales-detail",
    title: "Sales Detail",
    concepts: ["Revenue Breakdown", "Revenue Mix", "Seasonality", "Growth Trends"],
    description: "Detailed revenue analysis by category shows the composition and trends of the company's top line, helping assess revenue quality and sustainability.",
    suggestedPrompts: [
      "What is the revenue mix by category?",
      "Are there seasonal revenue patterns?",
      "Which revenue streams are growing or declining?",
    ],
    keyTerms: [
      { term: "Revenue Mix", definition: "Composition of total revenue by product, service, or category" },
      { term: "Seasonality", definition: "Recurring patterns in revenue that correlate with time of year" },
    ],
  },
  "5-7": {
    sectionKey: "cogs-detail",
    title: "Cost of Goods Sold",
    concepts: ["Gross Margin Analysis", "Cost Structure", "Material Costs", "Direct Labor"],
    description: "COGS detail shows the composition of direct costs, enabling analysis of gross margin trends and cost efficiency.",
    suggestedPrompts: [
      "What is driving gross margin changes?",
      "Are material costs increasing faster than revenue?",
      "How should I analyze COGS as a percentage of revenue?",
    ],
    keyTerms: [
      { term: "Gross Margin", definition: "Revenue minus COGS, expressed as a percentage of revenue" },
      { term: "Direct Costs", definition: "Costs directly attributable to producing goods or services" },
    ],
  },
  "5-8": {
    sectionKey: "operating-expenses",
    title: "Operating Expenses",
    concepts: ["OpEx Analysis", "Fixed vs Variable Costs", "SG&A", "Overhead"],
    description: "Operating expense detail helps identify fixed vs. variable cost components and opportunities for post-acquisition cost optimization.",
    suggestedPrompts: [
      "Which operating expenses are fixed vs. variable?",
      "Are there any unusual or non-recurring OpEx items?",
      "How do operating expenses compare to industry benchmarks?",
    ],
    keyTerms: [
      { term: "SG&A", definition: "Selling, General & Administrative expenses" },
      { term: "Fixed Costs", definition: "Expenses that remain constant regardless of revenue levels" },
    ],
  },
  "5-9": {
    sectionKey: "other-income-expense",
    title: "Other Income/Expense",
    concepts: ["Non-Operating Items", "Interest Expense", "One-Time Items", "Below-the-Line"],
    description: "Other income and expense items are typically excluded from EBITDA but may reveal important information about the company's financial structure.",
    suggestedPrompts: [
      "Which items here should be adjusted for EBITDA?",
      "Are there any recurring items misclassified as other?",
      "How do I treat interest income in a QoE?",
    ],
    keyTerms: [
      { term: "Non-Operating", definition: "Income or expenses not related to core business operations" },
      { term: "Below-the-Line", definition: "Items excluded from operating income and EBITDA calculations" },
    ],
  },
  "5-10": {
    sectionKey: "qoe-analysis",
    title: "QoE Analysis",
    concepts: ["Adjustment Detail", "Trend Analysis", "Risk Assessment"],
    description: "Detailed QoE analysis provides the supporting rationale for each adjustment, including documentation and buyer/seller negotiation points.",
    suggestedPrompts: [
      "How do I document adjustment rationale?",
      "What trends should I highlight in my analysis?",
      "How do buyers typically challenge QoE adjustments?",
    ],
    keyTerms: [
      { term: "Adjustment Rationale", definition: "Documentation supporting why an adjustment is appropriate" },
      { term: "Management Adjustment", definition: "Adjustments proposed by the seller's management team" },
    ],
  },
  "5-11": {
    sectionKey: "qoe-summary",
    title: "QoE Summary",
    concepts: ["EBITDA Bridge", "Adjustment Summary", "Earnings Quality"],
    description: "The QoE summary presents the bridge from reported to adjusted EBITDA, summarizing all adjustments and their impact on normalized earnings.",
    suggestedPrompts: [
      "How should I structure an EBITDA bridge?",
      "What makes earnings 'high quality'?",
      "How do I prioritize which adjustments to highlight?",
    ],
    keyTerms: [
      { term: "EBITDA Bridge", definition: "Walkthrough from reported to adjusted EBITDA showing each adjustment" },
      { term: "Earnings Quality", definition: "Assessment of how sustainable and reliable reported earnings are" },
    ],
  },
  "5-12": {
    sectionKey: "working-capital",
    title: "Working Capital",
    concepts: ["NWC Target", "Peg Calculation", "Seasonal Adjustments"],
    description: "Working capital analysis determines the NWC target or peg for the transaction, affecting the purchase price adjustment at close.",
    suggestedPrompts: [
      "How is the NWC target typically calculated?",
      "What items are usually excluded from NWC?",
      "How do I handle seasonal working capital?",
    ],
    keyTerms: [
      { term: "NWC Peg", definition: "The agreed working capital target that affects purchase price adjustments" },
      { term: "True-Up", definition: "Post-closing adjustment to purchase price based on actual vs. target NWC" },
    ],
  },
  "5-13": {
    sectionKey: "nwc-fcf",
    title: "NWC & FCF Analysis",
    concepts: ["Free Cash Flow", "Cash Conversion", "Working Capital Cycle"],
    description: "FCF analysis shows how efficiently the business converts EBITDA to cash, identifying potential cash flow issues or opportunities.",
    suggestedPrompts: [
      "How do I calculate free cash flow from EBITDA?",
      "What's a good cash conversion rate?",
      "How does working capital affect FCF?",
    ],
    keyTerms: [
      { term: "Free Cash Flow", definition: "Cash generated after operating expenses and capital expenditures" },
      { term: "Cash Conversion", definition: "Ratio of FCF to EBITDA - measures cash generation efficiency" },
    ],
  },
  "5-14": {
    sectionKey: "cash-analysis",
    title: "Cash Analysis",
    concepts: ["Cash Position", "Cash Flow Trends", "Liquidity"],
    description: "Cash analysis examines the company's cash position and trends, helping assess liquidity and the quality of reported cash balances.",
    suggestedPrompts: [
      "What drives changes in the cash balance?",
      "How do I assess the company's liquidity position?",
      "Are there any unusual cash movements?",
    ],
    keyTerms: [
      { term: "Liquidity", definition: "The ability to meet short-term financial obligations with available cash" },
      { term: "Cash Position", definition: "Total cash and cash equivalents at a point in time" },
    ],
  },
  "5-15": {
    sectionKey: "other-current-assets",
    title: "Other Current Assets",
    concepts: ["Prepaid Expenses", "Deposits", "Short-Term Receivables"],
    description: "Other current assets include prepaid expenses, deposits, and miscellaneous receivables that may require working capital adjustments.",
    suggestedPrompts: [
      "Should prepaid expenses be included in NWC?",
      "Are there any unusual items in other current assets?",
      "How do I evaluate the recoverability of deposits?",
    ],
    keyTerms: [
      { term: "Prepaid Expenses", definition: "Payments made in advance for goods or services to be received" },
      { term: "Deposits", definition: "Security deposits or advance payments held by third parties" },
    ],
  },
  "5-16": {
    sectionKey: "other-current-liabilities",
    title: "Other Current Liabilities",
    concepts: ["Accrued Expenses", "Deferred Revenue", "Short-Term Obligations"],
    description: "Other current liabilities include accrued expenses, deferred revenue, and other short-term obligations relevant to working capital analysis.",
    suggestedPrompts: [
      "How do accrued expenses affect working capital?",
      "Is deferred revenue growing or declining?",
      "Are there any unrecorded liabilities?",
    ],
    keyTerms: [
      { term: "Accrued Expenses", definition: "Expenses incurred but not yet paid" },
      { term: "Deferred Revenue", definition: "Cash received for services or products not yet delivered" },
    ],
  },
  "5-17": {
    sectionKey: "proof-of-cash",
    title: "Proof of Cash",
    concepts: ["Bank Reconciliation", "Cash Verification", "Deposit Analysis"],
    description: "Proof of cash reconciles book cash to bank statements, validating reported revenue and identifying potential fraudulent activity.",
    suggestedPrompts: [
      "What does proof of cash validate?",
      "How do I reconcile book to bank?",
      "What discrepancies are red flags?",
    ],
    keyTerms: [
      { term: "Proof of Cash", definition: "Four-way reconciliation of beginning/ending cash and receipts/disbursements" },
      { term: "Deposit Analysis", definition: "Tracing bank deposits to recorded revenue" },
    ],
  },
  "5-18": {
    sectionKey: "free-cash-flow",
    title: "Free Cash Flow",
    concepts: ["FCF Calculation", "CapEx Requirements", "Cash Conversion"],
    description: "Free cash flow analysis shows cash generated after capital expenditures, providing insight into the business's true cash-generating ability.",
    suggestedPrompts: [
      "How is free cash flow calculated?",
      "What CapEx level is sustainable?",
      "How does FCF compare to adjusted EBITDA?",
    ],
    keyTerms: [
      { term: "Free Cash Flow", definition: "Operating cash flow minus capital expenditures" },
      { term: "Maintenance CapEx", definition: "Capital spending required to sustain current operations" },
    ],
  },

  // Phase 6: Deliverables
  "6-1": {
    sectionKey: "executive-summary",
    title: "QoE Executive Summary",
    concepts: ["Key Findings", "Deal Considerations", "Risk Factors"],
    description: "The executive summary distills the QoE analysis into key findings, risks, and recommendations for deal decision-makers.",
    suggestedPrompts: [
      "What should an executive summary include?",
      "How do I prioritize findings for the summary?",
      "What tone should the executive summary have?",
    ],
    keyTerms: [
      { term: "Executive Summary", definition: "High-level overview of QoE findings for senior stakeholders" },
      { term: "Key Finding", definition: "Material issue or insight that affects deal value or risk" },
    ],
  },
  "6-2": {
    sectionKey: "financial-reports",
    title: "Financial Reports",
    concepts: ["Report Package", "Adjusted Financials", "Period Comparison"],
    description: "The financial reports package presents adjusted financial statements in a format suitable for deal documentation and negotiations.",
    suggestedPrompts: [
      "What reports are included in a standard QoE package?",
      "How should adjusted financials be formatted?",
      "What disclaimers should be included?",
    ],
    keyTerms: [
      { term: "QoE Report", definition: "Comprehensive document presenting all QoE findings and adjusted financials" },
      { term: "Management Discussion", definition: "Section explaining variances and business context" },
    ],
  },
  "6-3": {
    sectionKey: "analysis-reports",
    title: "Analysis Reports",
    concepts: ["Detailed Schedules", "Supporting Analysis", "Trend Charts"],
    description: "Analysis reports provide detailed supporting schedules and analytics that back up the summary-level QoE findings.",
    suggestedPrompts: [
      "What supporting analysis should be included?",
      "How detailed should my schedules be?",
      "What visualizations help tell the story?",
    ],
    keyTerms: [
      { term: "Supporting Schedule", definition: "Detailed breakdown behind summary figures" },
      { term: "Trend Analysis", definition: "Period-over-period comparison showing patterns" },
    ],
  },
  "6-4": {
    sectionKey: "export-center",
    title: "Export Center",
    concepts: ["Report Generation", "Data Export", "Deliverable Formats"],
    description: "The export center allows generation of final QoE deliverables in various formats for distribution to deal stakeholders.",
    suggestedPrompts: [
      "What formats should QoE reports be delivered in?",
      "How do I prepare files for the data room?",
      "What should be included in the final deliverable?",
    ],
    keyTerms: [
      { term: "Data Room", definition: "Secure repository for sharing due diligence documents" },
      { term: "Deliverable", definition: "Final work product provided to the client" },
    ],
  },
};

// Get education content for a specific section
export const getSectionEducation = (phase: number, section: number): SectionEducation | null => {
  const key = `${phase}-${section}`;
  return QOE_SECTION_EDUCATION[key] || null;
};

// Get all suggested prompts for a section
export const getSuggestedPrompts = (phase: number, section: number): string[] => {
  const education = getSectionEducation(phase, section);
  return education?.suggestedPrompts || [
    "What is Quality of Earnings analysis?",
    "What are common EBITDA adjustments?",
    "How do I identify red flags in financial data?",
  ];
};

// Build educational context string for AI
export const buildEducationalContext = (phase: number, section: number): string => {
  const education = getSectionEducation(phase, section);
  if (!education) return "";

  const termsText = education.keyTerms
    .map(t => `- **${t.term}**: ${t.definition}`)
    .join("\n");

  return `
## Current Wizard Section: ${education.title}

### Key Concepts
${education.concepts.join(", ")}

### Section Overview
${education.description}

### Key Terms for This Section
${termsText}
`;
};
