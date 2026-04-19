 /**
  * QoE Adjustment Taxonomy
  * 
  * Intent-driven sign convention: users select semantic intent,
  * system computes EBITDA sign (+/-) at sync time.
  * 
  * Period columns are derived from project.periods, not hardcoded.
  * Hardcoding column letters is not allowed outside fallback defaults.
  */
 
 // ============================================
 // Effect Types
 // ============================================
 
 export type LedgerEffectType = "EBITDA" | "PresentationOnly" | "NonQoE";
 
 // ============================================
 // Block Types (where adjustments render in the sheet)
 // ============================================
 
 export type QoeAdjustmentType = "MA" | "DD" | "PF";
 export type QoeBlockType = QoeAdjustmentType | "RECLASS";
 
 // ============================================
 // Adjustment Classes
 // ============================================
 
 export type AdjustmentClass = 
   | "timing"          // Revenue/expense timing shifts
   | "policy"          // Accounting policy normalization
   | "nonrecurring"    // One-time items to remove
   | "normalization"   // Ongoing normalization (owner comp, rent)
   | "proforma"        // Forward-looking operational changes
   | "reclassification"; // Presentation-only moves
 
 // ============================================
 // Intent Types (what the user selects)
 // ============================================
 
 export type LedgerIntent =
   | "remove_expense"          // Add back one-time expense → +EBITDA
   | "remove_revenue"          // Remove non-recurring revenue → -EBITDA
   | "add_expense"             // Recognize missing expense → -EBITDA
   | "add_revenue"             // Recognize missing revenue → +EBITDA
   | "normalize_up_expense"    // Normalize expense upward → -EBITDA
   | "normalize_down_expense"  // Normalize expense downward → +EBITDA
   | "other";                  // User manually chooses sign
 
 // ============================================
 // Intent → Sign Mapping
 // ============================================
 
 export const INTENT_TO_SIGN: Record<LedgerIntent, 1 | -1 | 0> = {
   remove_expense: 1,           // Adds to EBITDA
   remove_revenue: -1,          // Subtracts from EBITDA
   add_expense: -1,             // Subtracts from EBITDA
   add_revenue: 1,              // Adds to EBITDA
   normalize_up_expense: -1,    // Expense goes up → -EBITDA
   normalize_down_expense: 1,   // Expense goes down → +EBITDA
   other: 0,                    // User specifies manually
  };
 
 // Human-friendly labels for UI
 export const INTENT_LABELS: Record<LedgerIntent, { label: string; description: string }> = {
   remove_expense: { 
     label: "Remove one-time expense", 
     description: "Add back a non-recurring expense to increase Adjusted EBITDA" 
   },
   remove_revenue: { 
     label: "Remove non-recurring revenue", 
     description: "Remove one-time revenue to decrease Adjusted EBITDA" 
   },
   add_expense: { 
     label: "Add missing expense", 
     description: "Recognize an expense that was understated, decreasing Adjusted EBITDA" 
   },
   add_revenue: { 
     label: "Add missing revenue", 
     description: "Recognize revenue that was understated, increasing Adjusted EBITDA" 
   },
   normalize_up_expense: { 
     label: "Normalize expense upward", 
     description: "Increase an expense to market rate, decreasing Adjusted EBITDA" 
   },
   normalize_down_expense: { 
     label: "Normalize expense downward", 
     description: "Decrease an expense to market rate, increasing Adjusted EBITDA" 
   },
   other: { 
     label: "Other adjustment", 
     description: "Custom adjustment with manually specified sign" 
   },
 };
 
 // ============================================
 // Adjustment Templates (UI-ready)
 // ============================================
 
 export interface AdjustmentTemplate {
   id: string;
   type: QoeAdjustmentType;
   adjustmentClass: AdjustmentClass;
   label: string;
   description: string;
   defaultIntent: LedgerIntent;
   typicalAnchor: string; // Typical TB account category
 }
 
 export const ADJUSTMENT_TEMPLATES: AdjustmentTemplate[] = [
   // MA - Management Adjustments
   {
     id: "ma-owner-comp",
     type: "MA",
     adjustmentClass: "normalization",
     label: "Owner compensation normalization",
     description: "Normalize owner/officer compensation to market rate",
     defaultIntent: "remove_expense",
     typicalAnchor: "payroll",
   },
   {
     id: "ma-related-party-exp",
     type: "MA",
     adjustmentClass: "normalization",
     label: "Related-party expense removal",
     description: "Remove personal or non-business related-party expenses",
     defaultIntent: "remove_expense",
     typicalAnchor: "operating expenses",
   },
   {
     id: "ma-rent-normalization",
     type: "MA",
     adjustmentClass: "normalization",
     label: "Related-party rent normalization",
     description: "Adjust related-party rent to fair market value",
     defaultIntent: "normalize_down_expense",
     typicalAnchor: "rent expense",
   },
   
   // DD - Due Diligence Adjustments
   {
     id: "dd-legal-settlement",
     type: "DD",
     adjustmentClass: "nonrecurring",
     label: "One-time legal settlement",
     description: "Remove non-recurring legal fees or settlement costs",
     defaultIntent: "remove_expense",
     typicalAnchor: "legal expense",
   },
   {
     id: "dd-restructuring",
     type: "DD",
     adjustmentClass: "nonrecurring",
     label: "Restructuring / severance",
     description: "Remove one-time restructuring or severance costs",
     defaultIntent: "remove_expense",
     typicalAnchor: "operating expenses",
   },
   {
     id: "dd-consulting",
     type: "DD",
     adjustmentClass: "nonrecurring",
     label: "One-time consulting / due diligence",
     description: "Remove transaction-related consulting or DD fees",
     defaultIntent: "remove_expense",
     typicalAnchor: "professional fees",
   },
   {
     id: "dd-asset-sale",
     type: "DD",
     adjustmentClass: "nonrecurring",
     label: "Asset sale gain/loss",
     description: "Remove non-operating gain or loss from asset disposition",
     defaultIntent: "remove_expense",
     typicalAnchor: "other income/expense",
   },
   {
     id: "dd-ppp-grant",
     type: "DD",
     adjustmentClass: "nonrecurring",
     label: "PPP / grant income removal",
     description: "Remove one-time government grants or PPP forgiveness",
     defaultIntent: "remove_revenue",
     typicalAnchor: "other income",
   },
   {
     id: "dd-revenue-cutoff",
     type: "DD",
     adjustmentClass: "timing",
     label: "Revenue cut-off adjustment",
     description: "Shift revenue to the period earned",
     defaultIntent: "add_revenue",
     typicalAnchor: "sales",
   },
   {
     id: "dd-returns-allowance",
     type: "DD",
     adjustmentClass: "timing",
     label: "Returns / allowance true-up",
     description: "Normalize reserves for expected returns or allowances",
     defaultIntent: "add_expense",
     typicalAnchor: "contra revenue",
   },
   {
     id: "dd-inventory-obsolescence",
     type: "DD",
     adjustmentClass: "policy",
     label: "Inventory obsolescence reserve",
     description: "Normalize inventory reserve to appropriate level",
     defaultIntent: "add_expense",
     typicalAnchor: "cost of goods sold",
   },
   {
     id: "dd-depreciation-policy",
     type: "DD",
     adjustmentClass: "policy",
     label: "Depreciation policy normalization",
     description: "Adjust depreciation to normalized useful lives",
     defaultIntent: "normalize_up_expense",
     typicalAnchor: "depreciation",
   },
   {
     id: "dd-capitalize-expense",
     type: "DD",
     adjustmentClass: "policy",
     label: "Capitalize vs expense correction",
     description: "Correct capitalization vs expense treatment",
     defaultIntent: "remove_expense",
     typicalAnchor: "operating expenses / fixed assets",
   },
   {
     id: "dd-accrual-timing",
     type: "DD",
     adjustmentClass: "timing",
     label: "Accrual timing adjustment",
     description: "Accrue or defer expenses to match revenue period",
     defaultIntent: "add_expense",
     typicalAnchor: "operating expenses",
   },
   {
     id: "dd-fx-hedging",
     type: "DD",
     adjustmentClass: "nonrecurring",
     label: "FX / fair value swings",
     description: "Remove non-operating FX or mark-to-market volatility",
     defaultIntent: "remove_expense",
     typicalAnchor: "other expense/income",
   },
   
   // PF - Pro Forma Adjustments
   {
     id: "pf-interest-normalization",
     type: "PF",
     adjustmentClass: "proforma",
     label: "Interest normalization",
     description: "Adjust to post-close debt structure and rates",
     defaultIntent: "remove_expense",
     typicalAnchor: "interest expense",
   },
   {
     id: "pf-synergy-savings",
     type: "PF",
     adjustmentClass: "proforma",
     label: "Synergy savings",
     description: "Recognize post-close operational synergies",
     defaultIntent: "remove_expense",
     typicalAnchor: "operating expenses",
   },
   {
     id: "pf-cost-reduction",
     type: "PF",
     adjustmentClass: "proforma",
     label: "Planned cost reduction",
     description: "Recognize planned cost savings initiatives",
     defaultIntent: "remove_expense",
     typicalAnchor: "operating expenses",
   },
 ];
 
 // Group templates by type for UI
 export const TEMPLATES_BY_TYPE: Record<QoeAdjustmentType, AdjustmentTemplate[]> = {
   MA: ADJUSTMENT_TEMPLATES.filter(t => t.type === "MA"),
   DD: ADJUSTMENT_TEMPLATES.filter(t => t.type === "DD"),
   PF: ADJUSTMENT_TEMPLATES.filter(t => t.type === "PF"),
 };
 
 // ============================================
 // Document-to-Template Mapping
 // ============================================
 
 export interface DocTemplateMapping {
   type: QoeAdjustmentType;
   adjustmentClass: AdjustmentClass;
   templateId?: string;
 }
 
 export const DOC_TO_TEMPLATE_MAP: Record<string, DocTemplateMapping[]> = {
   legal_settlement: [{ type: "DD", adjustmentClass: "nonrecurring", templateId: "dd-legal-settlement" }],
   bank_statement: [{ type: "DD", adjustmentClass: "timing" }],
   payroll_record: [{ type: "MA", adjustmentClass: "normalization", templateId: "ma-owner-comp" }],
   lease_agreement: [{ type: "PF", adjustmentClass: "normalization" }, { type: "MA", adjustmentClass: "normalization", templateId: "ma-rent-normalization" }],
   tax_return: [{ type: "DD", adjustmentClass: "policy" }],
   invoice: [{ type: "DD", adjustmentClass: "timing" }],
   restructuring_plan: [{ type: "DD", adjustmentClass: "nonrecurring", templateId: "dd-restructuring" }],
   grant_award: [{ type: "DD", adjustmentClass: "nonrecurring", templateId: "dd-ppp-grant" }],
 };
 
 // ============================================
 // Validation & Fallback Policy
 // ============================================
 
 export const FALLBACK_POLICY = {
   unmappedTbAccount: "allowButFlag" as const,
   missingEvidence: "allowButFlag" as const,
   unknownBlockType: "defaultToDDButFlag" as const,
   unbalancedReclass: "blockSaveUnlessOverride" as const,
 };
 
 // Compute sign from intent
 export function computeSign(intent: LedgerIntent): number {
   const sign = INTENT_TO_SIGN[intent];
   return sign === 0 ? 1 : sign; // Default to positive if "other"
 }
 
 // Get template by ID
 export function getTemplateById(id: string): AdjustmentTemplate | undefined {
   return ADJUSTMENT_TEMPLATES.find(t => t.id === id);
 }