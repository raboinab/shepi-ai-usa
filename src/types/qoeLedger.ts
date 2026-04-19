/**
   * QoE Ledger Data Model
   * 
   * Ledger IDs are stable UUIDs. Sheet row positions are computed at sync time.
   * User selects intent, not sign. System computes sign (+/-) from intent.
   */
  
  import type { LedgerIntent, LedgerEffectType, AdjustmentClass, QoeAdjustmentType } from "@/lib/qoeAdjustmentTaxonomy";
 
 // ============================================
 // EBITDA-Impacting Adjustment (MA/DD/PF)
 // ============================================
 
 export interface QoeLedgerAdjustment {
   /** Stable UUID - never changes */
   id: string;
   
    /** Block type determines which sheet block (MA/DD/PF) */
    block: QoeAdjustmentType;
    
    /** Effect type — "EBITDA" flows into Adjusted EBITDA; "NonQoE" renders as memo only */
    effectType: "EBITDA" | LedgerEffectType;
   
   /** Semantic classification */
   adjustmentClass: AdjustmentClass;
   
   /** User-selected intent - drives sign computation */
   intent: LedgerIntent;
   
   /** Required: TB account number for linkage */
   linkedAccountNumber: string;
   
   /** Display only: account name for UI */
   linkedAccountName?: string;
   
   /** User description */
   description: string;
   
   /** Evidence notes or document references */
   evidenceNotes?: string;
   
   /** 
    * Monthly values keyed by canonical period IDs ("2024-01")
    * Values are absolute; sign computed from intent at sync time
    */
   periodValues: Record<string, number>;
   
   /** How this adjustment was created */
   sourceType: "manual" | "ai" | "template";
   
   /** Template ID if created from template */
   templateId?: string;
   
   /** Workflow status */
   status: "proposed" | "accepted" | "rejected";
   
   /** ISO timestamp */
   createdAt: string;
 }
 
 // ============================================
 // Presentation-Only Reclassification
 // ============================================
 
 export interface QoeLedgerReclass {
   /** Stable UUID */
   id: string;
   
   /** Always PresentationOnly - no EBITDA impact */
   effectType: "PresentationOnly";
   
   /** Description of the reclassification */
   description: string;
   
   /** Source account number */
   fromAccountNumber: string;
   
   /** Source FS Line Item (for display) */
   fromFsLineItem?: string;
   
   /** Target account number */
   toAccountNumber: string;
   
   /** Target FS Line Item (for display) */
   toFsLineItem?: string;
   
   /** 
    * Fixed arrays aligned to bucket columns (AT:BA)
    * Length = 8 columns
    */
   bucket1Values: number[];
   
   /** 
    * Fixed arrays aligned to bucket columns (BF:BM)
    * Length = 8 columns
    */
   bucket2Values: number[];
   
   /** How this reclass was created */
   sourceType: "manual" | "ai";
   
   /** Workflow status */
   status: "proposed" | "accepted" | "rejected";
   
   /** ISO timestamp */
   createdAt: string;
 }
 
 // ============================================
 // Complete Ledger Structure
 // ============================================
 
 export interface QoeLedger {
   /** EBITDA-impacting adjustments (MA/DD/PF) */
   adjustments: QoeLedgerAdjustment[];
   
   /** Presentation-only reclassifications */
   reclasses: QoeLedgerReclass[];
 }
 
 // ============================================
 // Validation Helpers
 // ============================================
 
 /** Check if reclassification buckets balance to zero */
 export function isReclassBalanced(reclass: QoeLedgerReclass): boolean {
   const bucket1Sum = reclass.bucket1Values.reduce((sum, val) => sum + (val || 0), 0);
   const bucket2Sum = reclass.bucket2Values.reduce((sum, val) => sum + (val || 0), 0);
   // Each bucket should sum to zero (from and to entries cancel out)
   return Math.abs(bucket1Sum) < 0.01 && Math.abs(bucket2Sum) < 0.01;
 }
 
 /** Create empty adjustment with defaults */
 export function createEmptyAdjustment(
   block: QoeAdjustmentType,
   templateId?: string
 ): QoeLedgerAdjustment {
   return {
     id: crypto.randomUUID(),
     block,
     effectType: "EBITDA",
     adjustmentClass: block === "PF" ? "proforma" : block === "MA" ? "normalization" : "nonrecurring",
     intent: "remove_expense",
     linkedAccountNumber: "",
     description: "",
     periodValues: {},
     sourceType: templateId ? "template" : "manual",
     templateId,
     status: "proposed",
     createdAt: new Date().toISOString(),
   };
 }
 
 /** Create empty reclassification with defaults */
 export function createEmptyReclass(): QoeLedgerReclass {
   return {
     id: crypto.randomUUID(),
     effectType: "PresentationOnly",
     description: "",
     fromAccountNumber: "",
     toAccountNumber: "",
     bucket1Values: Array(8).fill(0),
     bucket2Values: Array(8).fill(0),
     sourceType: "manual",
     status: "proposed",
     createdAt: new Date().toISOString(),
   };
 }