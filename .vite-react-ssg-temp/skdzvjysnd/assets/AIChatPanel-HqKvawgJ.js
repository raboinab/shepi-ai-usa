import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useState, useRef, useEffect } from "react";
import { B as Button, s as supabase } from "../main.mjs";
import { I as Input } from "./input-CSM87NBF.js";
import { S as ScrollArea } from "./scroll-area-DQ-itlDB.js";
import { S as Spinner } from "./spinner-DXdBpr08.js";
import { Sparkles, Maximize2, GripVertical, Trash2, Minus, X, BookOpen, Loader2, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { u as useChatHistory, c as getIndustryContext, s as sanitizeWizardData } from "./sanitizeWizardData-nrsUY-BP.js";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
const QOE_SECTION_EDUCATION = {
  // Phase 1: Project Setup
  "1-1": {
    sectionKey: "company-info",
    title: "Company Information",
    concepts: ["Target Company Profile", "Deal Context", "Industry Analysis"],
    description: "Understanding the target company's background is crucial for contextualizing the QoE analysis. This includes ownership structure, business model, and industry dynamics that may affect earnings quality.",
    suggestedPrompts: [
      "What company information is most important for a QoE analysis?",
      "How does industry affect earnings quality assessment?",
      "What red flags should I look for in company background?"
    ],
    keyTerms: [
      { term: "Target Company", definition: "The business being analyzed for potential acquisition or investment" },
      { term: "Transaction Type", definition: "The nature of the deal (acquisition, merger, investment, etc.)" }
    ]
  },
  "1-2": {
    sectionKey: "due-diligence",
    title: "Due Diligence Information",
    concepts: ["Due Diligence Scope", "Data Room Access", "Management Interviews"],
    description: "Due diligence sets the parameters for the QoE analysis, including time periods covered, data availability, and any limitations that may affect conclusions.",
    suggestedPrompts: [
      "What periods should a QoE analysis typically cover?",
      "What are common due diligence limitations?",
      "How do I document scope limitations in my analysis?"
    ],
    keyTerms: [
      { term: "Scope Limitations", definition: "Constraints on the analysis due to data availability or time restrictions" },
      { term: "Analysis Period", definition: "The fiscal periods being examined in the QoE review" }
    ]
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
      "Validate my balance sheet account classifications"
    ],
    keyTerms: [
      { term: "Chart of Accounts", definition: "The organized list of all accounts used to record transactions" },
      { term: "Account Classification", definition: "Grouping accounts into categories like revenue, COGS, operating expenses" },
      { term: "FS Line Item", definition: "The standardized financial statement line where an account appears (e.g., Cash, Fixed Assets, Operating Expenses)" },
      { term: "Mapping Validation", definition: "Comparing account classifications against QuickBooks standard mapping rules to identify errors" }
    ]
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
      "Identify any accounts with potential classification issues"
    ],
    keyTerms: [
      { term: "Trial Balance", definition: "A listing of all general ledger accounts and their balances at a point in time" },
      { term: "Account Mapping", definition: "Categorizing GL accounts into standardized financial statement line items" },
      { term: "Balance Check", definition: "Verification that BS + IS = 0 (debits equal credits)" },
      { term: "Variance Analysis", definition: "Comparing period-over-period changes to identify anomalies" }
    ]
  },
  "2-3": {
    sectionKey: "document-upload",
    title: "Document Upload",
    concepts: ["Source Documentation", "Audit Trail", "Data Validation"],
    description: "Supporting documents provide evidence for adjustments and help validate financial data. Bank statements, invoices, and contracts are critical for substantiating the analysis.",
    suggestedPrompts: [
      "What documents are essential for a QoE analysis?",
      "How do I validate data from uploaded documents?",
      "What if key documents are missing?"
    ],
    keyTerms: [
      { term: "Source Documents", definition: "Original records that support financial transactions" },
      { term: "Proof of Cash", definition: "Reconciliation of book cash to bank statements" }
    ]
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
      "What adjustments do buyers typically push back on?"
    ],
    keyTerms: [
      { term: "EBITDA", definition: "Earnings Before Interest, Taxes, Depreciation, and Amortization" },
      { term: "Normalization", definition: "Adjusting for non-recurring or unusual items to show sustainable earnings" },
      { term: "Add-back", definition: "An expense added back to EBITDA to increase adjusted earnings" },
      { term: "Run-Rate", definition: "Annualized earnings based on recent performance trends" }
    ]
  },
  "3-2": {
    sectionKey: "reclassifications",
    title: "Reclassifications",
    concepts: ["Financial Statement Reclassification", "Above/Below the Line", "COGS vs OpEx"],
    description: "Reclassifications correct the presentation of items on financial statements without changing net income. They ensure proper categorization for EBITDA and margin analysis.",
    suggestedPrompts: [
      "When should I reclassify vs. adjust an item?",
      "What's the impact of reclassifying between COGS and OpEx?",
      "How do reclassifications affect EBITDA?"
    ],
    keyTerms: [
      { term: "Reclassification", definition: "Moving an item from one line to another without changing total earnings" },
      { term: "Above the Line", definition: "Items included in EBITDA calculation (revenue through operating income)" }
    ]
  },
  "3-3": {
    sectionKey: "ar-aging",
    title: "AR Aging",
    concepts: ["Accounts Receivable", "Collectibility", "DSO Analysis", "Bad Debt"],
    description: "AR aging analysis assesses the quality of receivables and potential collection issues. High DSO or aging concentrations may indicate revenue quality concerns.",
    suggestedPrompts: [
      "What AR aging buckets are concerning?",
      "How do I calculate and interpret DSO?",
      "What bad debt reserve is appropriate?"
    ],
    keyTerms: [
      { term: "DSO", definition: "Days Sales Outstanding - measures how quickly receivables are collected" },
      { term: "Aging Bucket", definition: "Categories of receivables based on days past due (current, 30, 60, 90+ days)" }
    ]
  },
  "3-4": {
    sectionKey: "ap-aging",
    title: "AP Aging",
    concepts: ["Accounts Payable", "DPO Analysis", "Vendor Terms", "Cash Management"],
    description: "AP aging reveals payment practices and potential cash flow issues. Stretching payables may inflate working capital artificially.",
    suggestedPrompts: [
      "How does AP aging affect working capital analysis?",
      "What does high DPO indicate?",
      "How do I identify if the company is stretching payables?"
    ],
    keyTerms: [
      { term: "DPO", definition: "Days Payable Outstanding - measures how long it takes to pay vendors" },
      { term: "Trade Payables", definition: "Amounts owed to vendors for goods and services" }
    ]
  },
  "3-5": {
    sectionKey: "fixed-assets",
    title: "Fixed Assets",
    concepts: ["PP&E", "Depreciation", "CapEx Analysis", "Asset Condition"],
    description: "Fixed asset analysis identifies deferred maintenance, unusual depreciation policies, and CapEx requirements that may affect future cash flows.",
    suggestedPrompts: [
      "How do I assess if CapEx has been deferred?",
      "What depreciation methods are most common?",
      "How does fixed asset analysis affect the QoE?"
    ],
    keyTerms: [
      { term: "CapEx", definition: "Capital Expenditures - spending on property, plant, and equipment" },
      { term: "Maintenance CapEx", definition: "Spending required to maintain current operations vs. growth CapEx" }
    ]
  },
  "3-6": {
    sectionKey: "inventory",
    title: "Inventory",
    concepts: ["Inventory Valuation", "DIO Analysis", "Obsolescence", "FIFO/LIFO"],
    description: "Inventory quality analysis identifies slow-moving or obsolete items that may require write-downs and affect gross margins.",
    suggestedPrompts: [
      "How do I identify obsolete inventory?",
      "What inventory metrics should I calculate?",
      "How does inventory method affect earnings?"
    ],
    keyTerms: [
      { term: "DIO", definition: "Days Inventory Outstanding - measures how long inventory is held" },
      { term: "Obsolescence Reserve", definition: "Allowance for inventory that may not be sellable at full value" }
    ]
  },
  "3-7": {
    sectionKey: "payroll",
    title: "Payroll",
    concepts: ["Compensation Analysis", "Owner Compensation", "FTE Analysis", "Benefits"],
    description: "Payroll analysis identifies owner/executive compensation that may need normalization and ensures staffing levels support the business.",
    suggestedPrompts: [
      "How do I normalize owner compensation?",
      "What's a reasonable market salary adjustment?",
      "How do I analyze payroll trends?"
    ],
    keyTerms: [
      { term: "Owner Compensation", definition: "Salary and benefits paid to owners that may exceed or fall below market rates" },
      { term: "FTE", definition: "Full-Time Equivalent - standardized measure of employee headcount" }
    ]
  },
  "3-8": {
    sectionKey: "supplementary",
    title: "Supplementary Schedules",
    concepts: ["Supporting Analysis", "Reconciliations", "Additional Schedules"],
    description: "Supplementary schedules provide additional detail and reconciliations to support the core QoE analysis and address specific deal requirements.",
    suggestedPrompts: [
      "What supplementary schedules are typically needed?",
      "How do I document my analysis methodology?",
      "What reconciliations should I prepare?"
    ],
    keyTerms: [
      { term: "Reconciliation", definition: "Matching two sets of records to verify accuracy" },
      { term: "Supporting Schedule", definition: "Detailed analysis backing up summary figures" }
    ]
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
      "What customer metrics should I calculate?"
    ],
    keyTerms: [
      { term: "Customer Concentration", definition: "Percentage of revenue from top customers - often flagged if >20% from one customer" },
      { term: "Revenue Quality", definition: "Assessment of whether revenue is recurring, contractual, and sustainable" }
    ]
  },
  "4-2": {
    sectionKey: "top-vendors",
    title: "Top Vendors",
    concepts: ["Vendor Concentration", "Supply Chain Risk", "Related Party Transactions"],
    description: "Vendor analysis identifies supply chain risks and potential related party transactions that may need adjustment or disclosure.",
    suggestedPrompts: [
      "What vendor concentration raises concerns?",
      "How do I identify related party vendors?",
      "What supply chain risks should I flag?"
    ],
    keyTerms: [
      { term: "Vendor Concentration", definition: "Reliance on a small number of suppliers for critical inputs" },
      { term: "Related Party", definition: "Entity with ownership or control relationship to the target" }
    ]
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
      "What income statement trends are red flags?"
    ],
    keyTerms: [
      { term: "Adjusted EBITDA", definition: "EBITDA after normalization adjustments" },
      { term: "EBITDA Margin", definition: "EBITDA as a percentage of revenue" }
    ]
  },
  "5-2": {
    sectionKey: "is-detailed",
    title: "Income Statement - Detailed",
    concepts: ["Account-Level Detail", "Expense Categorization", "Variance Analysis"],
    description: "The detailed income statement shows account-level breakdowns for each line item, enabling granular analysis of revenue and expense components.",
    suggestedPrompts: [
      "Which accounts are driving revenue changes?",
      "Are there any unusual expense line items?",
      "How do I identify misclassified accounts in the IS?"
    ],
    keyTerms: [
      { term: "Account-Level Detail", definition: "Individual GL account balances that roll up to financial statement line items" },
      { term: "Expense Categorization", definition: "Proper classification of expenses into COGS, OpEx, and other categories" }
    ]
  },
  "5-3": {
    sectionKey: "balance-sheet",
    title: "Balance Sheet",
    concepts: ["Working Capital", "Net Debt", "Off-Balance Sheet Items"],
    description: "The adjusted balance sheet identifies working capital requirements and net debt for deal pricing and post-close cash needs.",
    suggestedPrompts: [
      "How is working capital defined for deals?",
      "What balance sheet items commonly need adjustment?",
      "How do I calculate net debt?"
    ],
    keyTerms: [
      { term: "Net Working Capital", definition: "Current assets minus current liabilities (often excludes cash and debt)" },
      { term: "Net Debt", definition: "Total debt minus cash and cash equivalents" }
    ]
  },
  "5-4": {
    sectionKey: "bs-detailed",
    title: "Balance Sheet - Detailed",
    concepts: ["Asset Detail", "Liability Detail", "Equity Components"],
    description: "The detailed balance sheet shows account-level breakdowns for assets, liabilities, and equity, enabling granular analysis of the company's financial position.",
    suggestedPrompts: [
      "Which asset accounts have unusual balances?",
      "Are there any unrecorded liabilities to watch for?",
      "How do I verify equity account accuracy?"
    ],
    keyTerms: [
      { term: "Asset Detail", definition: "Individual account balances within current and non-current asset categories" },
      { term: "Equity Components", definition: "Retained earnings, contributed capital, and other equity accounts" }
    ]
  },
  "5-5": {
    sectionKey: "is-bs-reconciliation",
    title: "Reconciling IS & BS",
    concepts: ["Net Income Reconciliation", "Retained Earnings Bridge", "Cross-Statement Validation"],
    description: "This QC check ensures that net income from the income statement flows correctly into retained earnings on the balance sheet, catching data integrity issues.",
    suggestedPrompts: [
      "Why doesn't my net income match the change in retained earnings?",
      "What causes IS-to-BS reconciliation differences?",
      "How do dividends affect the reconciliation?"
    ],
    keyTerms: [
      { term: "Retained Earnings Bridge", definition: "Beginning RE + Net Income − Dividends = Ending RE" },
      { term: "Cross-Statement Validation", definition: "Verifying consistency between income statement and balance sheet" }
    ]
  },
  "5-6": {
    sectionKey: "sales-detail",
    title: "Sales Detail",
    concepts: ["Revenue Breakdown", "Revenue Mix", "Seasonality", "Growth Trends"],
    description: "Detailed revenue analysis by category shows the composition and trends of the company's top line, helping assess revenue quality and sustainability.",
    suggestedPrompts: [
      "What is the revenue mix by category?",
      "Are there seasonal revenue patterns?",
      "Which revenue streams are growing or declining?"
    ],
    keyTerms: [
      { term: "Revenue Mix", definition: "Composition of total revenue by product, service, or category" },
      { term: "Seasonality", definition: "Recurring patterns in revenue that correlate with time of year" }
    ]
  },
  "5-7": {
    sectionKey: "cogs-detail",
    title: "Cost of Goods Sold",
    concepts: ["Gross Margin Analysis", "Cost Structure", "Material Costs", "Direct Labor"],
    description: "COGS detail shows the composition of direct costs, enabling analysis of gross margin trends and cost efficiency.",
    suggestedPrompts: [
      "What is driving gross margin changes?",
      "Are material costs increasing faster than revenue?",
      "How should I analyze COGS as a percentage of revenue?"
    ],
    keyTerms: [
      { term: "Gross Margin", definition: "Revenue minus COGS, expressed as a percentage of revenue" },
      { term: "Direct Costs", definition: "Costs directly attributable to producing goods or services" }
    ]
  },
  "5-8": {
    sectionKey: "operating-expenses",
    title: "Operating Expenses",
    concepts: ["OpEx Analysis", "Fixed vs Variable Costs", "SG&A", "Overhead"],
    description: "Operating expense detail helps identify fixed vs. variable cost components and opportunities for post-acquisition cost optimization.",
    suggestedPrompts: [
      "Which operating expenses are fixed vs. variable?",
      "Are there any unusual or non-recurring OpEx items?",
      "How do operating expenses compare to industry benchmarks?"
    ],
    keyTerms: [
      { term: "SG&A", definition: "Selling, General & Administrative expenses" },
      { term: "Fixed Costs", definition: "Expenses that remain constant regardless of revenue levels" }
    ]
  },
  "5-9": {
    sectionKey: "other-income-expense",
    title: "Other Income/Expense",
    concepts: ["Non-Operating Items", "Interest Expense", "One-Time Items", "Below-the-Line"],
    description: "Other income and expense items are typically excluded from EBITDA but may reveal important information about the company's financial structure.",
    suggestedPrompts: [
      "Which items here should be adjusted for EBITDA?",
      "Are there any recurring items misclassified as other?",
      "How do I treat interest income in a QoE?"
    ],
    keyTerms: [
      { term: "Non-Operating", definition: "Income or expenses not related to core business operations" },
      { term: "Below-the-Line", definition: "Items excluded from operating income and EBITDA calculations" }
    ]
  },
  "5-10": {
    sectionKey: "qoe-analysis",
    title: "QoE Analysis",
    concepts: ["Adjustment Detail", "Trend Analysis", "Risk Assessment"],
    description: "Detailed QoE analysis provides the supporting rationale for each adjustment, including documentation and buyer/seller negotiation points.",
    suggestedPrompts: [
      "How do I document adjustment rationale?",
      "What trends should I highlight in my analysis?",
      "How do buyers typically challenge QoE adjustments?"
    ],
    keyTerms: [
      { term: "Adjustment Rationale", definition: "Documentation supporting why an adjustment is appropriate" },
      { term: "Management Adjustment", definition: "Adjustments proposed by the seller's management team" }
    ]
  },
  "5-11": {
    sectionKey: "qoe-summary",
    title: "QoE Summary",
    concepts: ["EBITDA Bridge", "Adjustment Summary", "Earnings Quality"],
    description: "The QoE summary presents the bridge from reported to adjusted EBITDA, summarizing all adjustments and their impact on normalized earnings.",
    suggestedPrompts: [
      "How should I structure an EBITDA bridge?",
      "What makes earnings 'high quality'?",
      "How do I prioritize which adjustments to highlight?"
    ],
    keyTerms: [
      { term: "EBITDA Bridge", definition: "Walkthrough from reported to adjusted EBITDA showing each adjustment" },
      { term: "Earnings Quality", definition: "Assessment of how sustainable and reliable reported earnings are" }
    ]
  },
  "5-12": {
    sectionKey: "working-capital",
    title: "Working Capital",
    concepts: ["NWC Target", "Peg Calculation", "Seasonal Adjustments"],
    description: "Working capital analysis determines the NWC target or peg for the transaction, affecting the purchase price adjustment at close.",
    suggestedPrompts: [
      "How is the NWC target typically calculated?",
      "What items are usually excluded from NWC?",
      "How do I handle seasonal working capital?"
    ],
    keyTerms: [
      { term: "NWC Peg", definition: "The agreed working capital target that affects purchase price adjustments" },
      { term: "True-Up", definition: "Post-closing adjustment to purchase price based on actual vs. target NWC" }
    ]
  },
  "5-13": {
    sectionKey: "nwc-fcf",
    title: "NWC & FCF Analysis",
    concepts: ["Free Cash Flow", "Cash Conversion", "Working Capital Cycle"],
    description: "FCF analysis shows how efficiently the business converts EBITDA to cash, identifying potential cash flow issues or opportunities.",
    suggestedPrompts: [
      "How do I calculate free cash flow from EBITDA?",
      "What's a good cash conversion rate?",
      "How does working capital affect FCF?"
    ],
    keyTerms: [
      { term: "Free Cash Flow", definition: "Cash generated after operating expenses and capital expenditures" },
      { term: "Cash Conversion", definition: "Ratio of FCF to EBITDA - measures cash generation efficiency" }
    ]
  },
  "5-14": {
    sectionKey: "cash-analysis",
    title: "Cash Analysis",
    concepts: ["Cash Position", "Cash Flow Trends", "Liquidity"],
    description: "Cash analysis examines the company's cash position and trends, helping assess liquidity and the quality of reported cash balances.",
    suggestedPrompts: [
      "What drives changes in the cash balance?",
      "How do I assess the company's liquidity position?",
      "Are there any unusual cash movements?"
    ],
    keyTerms: [
      { term: "Liquidity", definition: "The ability to meet short-term financial obligations with available cash" },
      { term: "Cash Position", definition: "Total cash and cash equivalents at a point in time" }
    ]
  },
  "5-15": {
    sectionKey: "other-current-assets",
    title: "Other Current Assets",
    concepts: ["Prepaid Expenses", "Deposits", "Short-Term Receivables"],
    description: "Other current assets include prepaid expenses, deposits, and miscellaneous receivables that may require working capital adjustments.",
    suggestedPrompts: [
      "Should prepaid expenses be included in NWC?",
      "Are there any unusual items in other current assets?",
      "How do I evaluate the recoverability of deposits?"
    ],
    keyTerms: [
      { term: "Prepaid Expenses", definition: "Payments made in advance for goods or services to be received" },
      { term: "Deposits", definition: "Security deposits or advance payments held by third parties" }
    ]
  },
  "5-16": {
    sectionKey: "other-current-liabilities",
    title: "Other Current Liabilities",
    concepts: ["Accrued Expenses", "Deferred Revenue", "Short-Term Obligations"],
    description: "Other current liabilities include accrued expenses, deferred revenue, and other short-term obligations relevant to working capital analysis.",
    suggestedPrompts: [
      "How do accrued expenses affect working capital?",
      "Is deferred revenue growing or declining?",
      "Are there any unrecorded liabilities?"
    ],
    keyTerms: [
      { term: "Accrued Expenses", definition: "Expenses incurred but not yet paid" },
      { term: "Deferred Revenue", definition: "Cash received for services or products not yet delivered" }
    ]
  },
  "5-17": {
    sectionKey: "proof-of-cash",
    title: "Proof of Cash",
    concepts: ["Bank Reconciliation", "Cash Verification", "Deposit Analysis"],
    description: "Proof of cash reconciles book cash to bank statements, validating reported revenue and identifying potential fraudulent activity.",
    suggestedPrompts: [
      "What does proof of cash validate?",
      "How do I reconcile book to bank?",
      "What discrepancies are red flags?"
    ],
    keyTerms: [
      { term: "Proof of Cash", definition: "Four-way reconciliation of beginning/ending cash and receipts/disbursements" },
      { term: "Deposit Analysis", definition: "Tracing bank deposits to recorded revenue" }
    ]
  },
  "5-18": {
    sectionKey: "free-cash-flow",
    title: "Free Cash Flow",
    concepts: ["FCF Calculation", "CapEx Requirements", "Cash Conversion"],
    description: "Free cash flow analysis shows cash generated after capital expenditures, providing insight into the business's true cash-generating ability.",
    suggestedPrompts: [
      "How is free cash flow calculated?",
      "What CapEx level is sustainable?",
      "How does FCF compare to adjusted EBITDA?"
    ],
    keyTerms: [
      { term: "Free Cash Flow", definition: "Operating cash flow minus capital expenditures" },
      { term: "Maintenance CapEx", definition: "Capital spending required to sustain current operations" }
    ]
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
      "What tone should the executive summary have?"
    ],
    keyTerms: [
      { term: "Executive Summary", definition: "High-level overview of QoE findings for senior stakeholders" },
      { term: "Key Finding", definition: "Material issue or insight that affects deal value or risk" }
    ]
  },
  "6-2": {
    sectionKey: "financial-reports",
    title: "Financial Reports",
    concepts: ["Report Package", "Adjusted Financials", "Period Comparison"],
    description: "The financial reports package presents adjusted financial statements in a format suitable for deal documentation and negotiations.",
    suggestedPrompts: [
      "What reports are included in a standard QoE package?",
      "How should adjusted financials be formatted?",
      "What disclaimers should be included?"
    ],
    keyTerms: [
      { term: "QoE Report", definition: "Comprehensive document presenting all QoE findings and adjusted financials" },
      { term: "Management Discussion", definition: "Section explaining variances and business context" }
    ]
  },
  "6-3": {
    sectionKey: "analysis-reports",
    title: "Analysis Reports",
    concepts: ["Detailed Schedules", "Supporting Analysis", "Trend Charts"],
    description: "Analysis reports provide detailed supporting schedules and analytics that back up the summary-level QoE findings.",
    suggestedPrompts: [
      "What supporting analysis should be included?",
      "How detailed should my schedules be?",
      "What visualizations help tell the story?"
    ],
    keyTerms: [
      { term: "Supporting Schedule", definition: "Detailed breakdown behind summary figures" },
      { term: "Trend Analysis", definition: "Period-over-period comparison showing patterns" }
    ]
  },
  "6-4": {
    sectionKey: "export-center",
    title: "Export Center",
    concepts: ["Report Generation", "Data Export", "Deliverable Formats"],
    description: "The export center allows generation of final QoE deliverables in various formats for distribution to deal stakeholders.",
    suggestedPrompts: [
      "What formats should QoE reports be delivered in?",
      "How do I prepare files for the data room?",
      "What should be included in the final deliverable?"
    ],
    keyTerms: [
      { term: "Data Room", definition: "Secure repository for sharing due diligence documents" },
      { term: "Deliverable", definition: "Final work product provided to the client" }
    ]
  }
};
const getSectionEducation = (phase, section) => {
  const key = `${phase}-${section}`;
  return QOE_SECTION_EDUCATION[key] || null;
};
const getSuggestedPrompts = (phase, section) => {
  const education = getSectionEducation(phase, section);
  return education?.suggestedPrompts || [
    "What is Quality of Earnings analysis?",
    "What are common EBITDA adjustments?",
    "How do I identify red flags in financial data?"
  ];
};
const STORAGE_KEY = "ai-chat-panel-size";
const POSITION_KEY = "ai-chat-panel-position";
const MIN_WIDTH = 300;
const MIN_HEIGHT = 350;
const MAX_WIDTH = 900;
const MAX_HEIGHT_VH = 90;
const getDefaultSize = () => {
  const isMobile = window.innerWidth < 768;
  return {
    width: isMobile ? window.innerWidth - 32 : 380,
    height: isMobile ? window.innerHeight * 0.5 : 500
  };
};
const getSavedSize = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        width: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, parsed.width)),
        height: Math.max(MIN_HEIGHT, Math.min(window.innerHeight * (MAX_HEIGHT_VH / 100), parsed.height))
      };
    }
  } catch {
  }
  return getDefaultSize();
};
const getDefaultPosition = () => ({ right: 16, bottom: 16 });
const getSavedPosition = () => {
  try {
    const saved = localStorage.getItem(POSITION_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        right: Math.max(0, Math.min(window.innerWidth - 100, parsed.right)),
        bottom: Math.max(0, Math.min(window.innerHeight - 100, parsed.bottom))
      };
    }
  } catch {
  }
  return getDefaultPosition();
};
const AIChatPanel = ({ project, currentPhase, currentSection, pendingPrompt, onPromptConsumed, onClose }) => {
  const sectionEducation = getSectionEducation(currentPhase, currentSection);
  const suggestedPrompts = getSuggestedPrompts(currentPhase, currentSection);
  const {
    messages: savedMessages,
    isLoading: isLoadingHistory,
    isAuthReady,
    saveMessages,
    clearHistory,
    hasHistory,
    oldestMessageDate
  } = useChatHistory({
    projectId: project.id,
    contextType: "wizard"
  });
  const getWelcomeMessage = useCallback(() => ({
    id: "welcome",
    role: "assistant",
    content: `Hi! I'm your QoE analyst assistant. ${sectionEducation ? `You're currently working on ${sectionEducation.title}. I can help explain concepts like ${sectionEducation.concepts.slice(0, 2).join(" and ")}, answer questions about your data, or identify potential issues.` : `I can help you with EBITDA adjustments, explain financial concepts, identify red flags, and guide you through the QoE analysis process.`}

What would you like help with?`
  }), [sectionEducation]);
  const [messages, setMessages] = useState([getWelcomeMessage()]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [size, setSize] = useState(getSavedSize);
  const [position, setPosition] = useState(getSavedPosition);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cimInsights, setCimInsights] = useState(null);
  const [ragStatus, setRagStatus] = useState("checking");
  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);
  const resizeStartRef = useRef(null);
  const dragStartRef = useRef(null);
  useEffect(() => {
    if (!isLoadingHistory && isAuthReady) {
      if (savedMessages.length > 0) {
        setMessages(savedMessages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content
        })));
      } else {
        setMessages([getWelcomeMessage()]);
      }
    }
  }, [isLoadingHistory, isAuthReady, savedMessages, getWelcomeMessage]);
  useEffect(() => {
    if (pendingPrompt) {
      setInput(pendingPrompt);
      setIsMinimized(false);
      onPromptConsumed?.();
    }
  }, [pendingPrompt]);
  useEffect(() => {
    const handler = (e) => {
      const prompt = e.detail;
      if (typeof prompt === "string" && prompt.trim()) {
        setInput(prompt);
        setIsMinimized(false);
      }
    };
    window.addEventListener("prefill-assistant", handler);
    return () => window.removeEventListener("prefill-assistant", handler);
  }, []);
  useEffect(() => {
    const checkAndTriggerIndexing = async () => {
      try {
        const { count: chunkCount } = await supabase.from("project_data_chunks").select("*", { count: "exact", head: true }).eq("project_id", project.id);
        if (chunkCount && chunkCount > 0) {
          setRagStatus("indexed");
          return;
        }
        const { count: pdCount } = await supabase.from("processed_data").select("*", { count: "exact", head: true }).eq("project_id", project.id);
        if (!pdCount || pdCount === 0) {
          setRagStatus("no-data");
          return;
        }
        console.log(`[AIChatPanel] No RAG chunks found but ${pdCount} processed_data records exist — triggering indexing`);
        setRagStatus("indexing");
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setRagStatus("no-data");
          return;
        }
        fetch(
          `${"https://mdgmessqbfebrbvjtndz.supabase.co"}/functions/v1/embed-project-data`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              project_id: project.id,
              data_types: null
            })
          }
        ).then((res) => {
          if (res.ok) {
            console.log("[AIChatPanel] RAG indexing triggered successfully");
            setRagStatus("indexed");
          } else {
            console.error("[AIChatPanel] RAG indexing failed:", res.status);
            setRagStatus("no-data");
          }
        }).catch((err) => {
          console.error("[AIChatPanel] RAG indexing error:", err);
          setRagStatus("no-data");
        });
      } catch (error) {
        console.error("[AIChatPanel] Error checking RAG index:", error);
      }
    };
    checkAndTriggerIndexing();
  }, [project.id]);
  useEffect(() => {
    const fetchCimInsights = async () => {
      try {
        const { data, error } = await supabase.from("processed_data").select("data").eq("project_id", project.id).eq("data_type", "cim_insights").order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (!error && data?.data) {
          setCimInsights(data.data);
        }
      } catch (error) {
        console.error("Error fetching CIM insights:", error);
      }
    };
    fetchCimInsights();
  }, [project.id]);
  useEffect(() => {
    const newEducation = getSectionEducation(currentPhase, currentSection);
    if (newEducation && messages.length === 1 && messages[0].id === "welcome") {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Hi! I'm your QoE analyst assistant. You're currently working on ${newEducation.title}. I can help explain concepts like ${newEducation.concepts.slice(0, 2).join(" and ")}, answer questions about your data, or identify potential issues.

What would you like help with?`
      }]);
    }
  }, [currentPhase, currentSection]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    if (!isResizing) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(size));
    }
  }, [size, isResizing]);
  useEffect(() => {
    if (!isDragging) {
      localStorage.setItem(POSITION_KEY, JSON.stringify(position));
    }
  }, [position, isDragging]);
  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    };
  }, [size]);
  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e) => {
      if (!resizeStartRef.current) return;
      const deltaX = resizeStartRef.current.x - e.clientX;
      const deltaY = resizeStartRef.current.y - e.clientY;
      const maxHeight = window.innerHeight * (MAX_HEIGHT_VH / 100);
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStartRef.current.width + deltaX));
      const newHeight = Math.max(MIN_HEIGHT, Math.min(maxHeight, resizeStartRef.current.height + deltaY));
      setSize({ width: newWidth, height: newHeight });
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);
  const handleDragStart = useCallback((e) => {
    if (e.target.closest("button")) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      right: position.right,
      bottom: position.bottom
    };
  }, [position]);
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      if (!dragStartRef.current) return;
      const deltaX = dragStartRef.current.mouseX - e.clientX;
      const deltaY = dragStartRef.current.mouseY - e.clientY;
      const newRight = Math.max(0, Math.min(window.innerWidth - size.width, dragStartRef.current.right + deltaX));
      const newBottom = Math.max(0, Math.min(window.innerHeight - 60, dragStartRef.current.bottom + deltaY));
      setPosition({ right: newRight, bottom: newBottom });
    };
    const onUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, size.width]);
  const isDemo = project.id === "demo";
  const sendMessage = async (messageText) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;
    if (isDemo) {
      toast.info("The AI Assistant is available on real projects", {
        description: "Sign up to try it with your data."
      });
      return;
    }
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: textToSend
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    try {
      const response = await fetch(
        `${"https://mdgmessqbfebrbvjtndz.supabase.co"}/functions/v1/insights-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZ21lc3NxYmZlYnJidmp0bmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDM4MzgsImV4cCI6MjA4ODU3OTgzOH0.T9Sedk2mU9iuObgODm7UBsmFZA6KO-hkZ1IookfYa68"}`
          },
          body: JSON.stringify({
            messages: [...messages.filter((m) => m.id !== "welcome"), userMessage].map((m) => ({
              role: m.role,
              content: m.content
            })),
            wizardData: sanitizeWizardData(project.wizard_data),
            projectInfo: {
              id: project.id,
              name: project.name,
              targetCompany: project.target_company,
              industry: project.industry,
              ...project.industry ? (() => {
                const ctx = getIndustryContext(project.industry);
                return { industryTraitsJson: ctx.traitsJson, industryNarrative: ctx.narrative };
              })() : {},
              periods: project.periods
            },
            currentSection: {
              phase: currentPhase,
              section: currentSection,
              sectionName: sectionEducation?.title || "Unknown"
            },
            cimInsights: cimInsights || void 0
          })
        }
      );
      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again in a moment.");
          setIsLoading(false);
          return;
        }
        if (response.status === 402) {
          toast.error("Usage limit reached. Please add credits to continue.");
          setIsLoading(false);
          return;
        }
        throw new Error("AI service error");
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantId = crypto.randomUUID();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(
                (prev) => prev.map(
                  (m) => m.id === assistantId ? { ...m, content: assistantContent } : m
                )
              );
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
      if (assistantContent) {
        await saveMessages(userMessage.content, assistantContent);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response. Please try again.");
      setMessages((prev) => prev.filter((m) => m.role !== "assistant" || m.content));
    } finally {
      setIsLoading(false);
    }
  };
  const handleClearChat = async () => {
    const success = await clearHistory();
    if (success) {
      setMessages([getWelcomeMessage()]);
      toast.success("Chat history cleared");
    } else {
      toast.error("Failed to clear chat history. Check console for details.");
    }
  };
  if (isMinimized) {
    return /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed z-50 bg-card border border-border rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow",
        style: { right: position.right, bottom: position.bottom },
        onClick: () => setIsMinimized(false),
        children: /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "w-5 h-5 text-primary" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium text-sm", children: "QoE Assistant" }),
          /* @__PURE__ */ jsx(Maximize2, { className: "w-4 h-4 text-muted-foreground ml-2" })
        ] })
      }
    );
  }
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: panelRef,
      className: "fixed z-50 bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden",
      style: {
        right: position.right,
        bottom: position.bottom,
        width: size.width,
        height: size.height,
        maxWidth: "calc(100vw - 32px)",
        maxHeight: `${MAX_HEIGHT_VH}vh`
      },
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute top-0 left-0 w-6 h-6 cursor-nw-resize z-10 flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity",
            onMouseDown: handleResizeStart,
            children: /* @__PURE__ */ jsx(GripVertical, { className: "w-3 h-3 text-muted-foreground rotate-45" })
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "p-3 border-b border-border flex items-center justify-between bg-muted/30 shrink-0 cursor-move", onMouseDown: handleDragStart, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "w-5 h-5 text-primary" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-sm", children: "QoE Assistant" }),
              hasHistory && oldestMessageDate && /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
                "Conversation from ",
                formatDistanceToNow(oldestMessageDate, { addSuffix: true })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            hasHistory && /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                className: "h-7 w-7",
                onClick: handleClearChat,
                title: "Clear chat history",
                children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
              }
            ),
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: () => setIsMinimized(true), children: /* @__PURE__ */ jsx(Minus, { className: "w-4 h-4" }) }),
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: onClose, children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
          ] })
        ] }),
        sectionEducation && /* @__PURE__ */ jsx("div", { className: "px-3 py-2 border-b border-border bg-muted/50 shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx(BookOpen, { className: "w-3 h-3" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Helping with: ",
            /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: sectionEducation.title })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs(ScrollArea, { className: "flex-1 p-3", ref: scrollRef, children: [
          isLoadingHistory && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center py-4 text-muted-foreground gap-2", children: [
            /* @__PURE__ */ jsx(Spinner, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs", children: "Loading conversation..." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            messages.map((message) => /* @__PURE__ */ jsx(
              "div",
              {
                className: `flex ${message.role === "user" ? "justify-end" : "justify-start"}`,
                children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: `max-w-[90%] rounded-lg px-3 py-2 text-sm ${message.role === "user" ? "bg-primary text-primary-foreground whitespace-pre-wrap" : "bg-muted border-l-2 border-primary/30"}`,
                    children: message.role === "assistant" ? message.content ? /* @__PURE__ */ jsx("div", { className: "prose prose-sm dark:prose-invert max-w-none [&>p]:my-2 [&>ul]:my-2 [&>ol]:my-2 [&>li]:my-0.5 [&>h1]:text-base [&>h1]:font-bold [&>h1]:mt-3 [&>h2]:text-sm [&>h2]:font-semibold [&>h2]:mt-3 [&>h3]:text-sm [&>h3]:font-medium [&>h3]:mt-2 [&>table]:text-xs [&>blockquote]:border-l-2 [&>blockquote]:border-muted-foreground/30 [&>blockquote]:pl-3 [&>blockquote]:text-muted-foreground", children: /* @__PURE__ */ jsx(ReactMarkdown, { children: message.content }) }) : /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
                      /* @__PURE__ */ jsx("span", { className: "w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" }),
                      /* @__PURE__ */ jsx("span", { className: "w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:100ms]" }),
                      /* @__PURE__ */ jsx("span", { className: "w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:200ms]" })
                    ] }) : message.content
                  }
                )
              },
              message.id
            )),
            /* @__PURE__ */ jsx("div", { ref: messagesEndRef })
          ] })
        ] }),
        messages.length <= 2 && /* @__PURE__ */ jsxs("div", { className: "px-3 pb-2 shrink-0", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-2", children: "Try asking:" }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: suggestedPrompts.slice(0, 3).map((prompt, i) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => sendMessage(prompt),
              disabled: isLoading,
              className: "text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50",
              children: prompt.length > 35 ? prompt.slice(0, 32) + "..." : prompt
            },
            i
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-3 border-t border-border shrink-0", children: [
          ragStatus === "indexing" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2", children: [
            /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin" }),
            /* @__PURE__ */ jsx("span", { children: "Analyzing your project data…" })
          ] }),
          ragStatus === "no-data" && /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground mb-2", children: "No project data found — upload documents for context-aware answers" }),
          /* @__PURE__ */ jsxs(
            "form",
            {
              onSubmit: (e) => {
                e.preventDefault();
                sendMessage();
              },
              className: "flex gap-2",
              children: [
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    placeholder: "Ask about QoE concepts...",
                    value: input,
                    onChange: (e) => setInput(e.target.value),
                    disabled: isLoading,
                    className: "text-sm"
                  }
                ),
                /* @__PURE__ */ jsx(Button, { type: "submit", size: "icon", disabled: isLoading || !input.trim(), className: "shrink-0", children: isLoading ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(Send, { className: "w-4 h-4" }) })
              ]
            }
          )
        ] })
      ]
    }
  );
};
export {
  AIChatPanel as A
};
