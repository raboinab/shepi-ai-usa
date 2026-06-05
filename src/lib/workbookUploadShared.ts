/**
 * Shared types for the offline workbook round-trip flow.
 * Used by the parse + commit edge functions, the upload button,
 * and the conflict resolution dialog.
 */

export const WORKBOOK_SCHEMA_VERSION = "1.1";
export const META_SHEET_NAME = "__shepi_meta";

/** Base snapshot of the writable portion of wizard_data at export time.
 *  Embedded as JSON in the hidden meta sheet so the committer can perform
 *  a true three-way merge against the current DB state. */
export interface WorkbookBaseSnapshot {
  /** Map of accountId -> periodId -> balance */
  trialBalance: Record<string, Record<string, number>>;
  /** Adjustments keyed by id */
  adjustments: Record<string, BaseAdjustment>;
}

export interface BaseAdjustment {
  id: string;
  type: string;
  label: string;
  tbAccountNumber?: string;
  intent?: string;
  notes?: string;
  periodValues: Record<string, number>;
}

/** A single edit detected in the uploaded workbook (mine = user's offline change). */
export interface MineEdits {
  /** Map of accountId -> periodId -> new balance (only changed cells) */
  trialBalance: Record<string, Record<string, number>>;
  /** Adjustments that exist in both base and workbook with changed amounts */
  adjustmentsChanged: Record<string, Record<string, number>>; // id -> periodId -> newValue
  /** Adjustments deleted from workbook (id in base, not in workbook) */
  adjustmentsDeleted: string[];
  /** Adjustments newly added in workbook (no matching base id) */
  adjustmentsAdded: BaseAdjustment[];
}

export interface ParseResultOk {
  ok: true;
  schemaVersion: string;
  projectId: string;
  exportedFromRevision: number;
  currentRevision: number;
  revisionDrifted: boolean;
  mine: MineEdits;
  base: WorkbookBaseSnapshot;
  summary: {
    tbCellsChanged: number;
    adjustmentsChanged: number;
    adjustmentsAdded: number;
    adjustmentsDeleted: number;
    deferredTabsSeen: string[];
  };
  warnings: string[];
}

export interface ParseResultErr {
  ok: false;
  error: string;
  details?: string;
}

export type ParseResult = ParseResultOk | ParseResultErr;

/** Conflict payload returned by commit-workbook-upload when force=false and
 *  the same field changed both online (theirs) and offline (mine). */
export interface FieldConflict {
  kind: "tb" | "adjustment_amount" | "adjustment_deleted_vs_edited";
  /** Human-readable label, e.g. "Cash · Jan 2024" or "MA · Owner Comp · Mar 2024" */
  label: string;
  /** Stable id for resolution mapping */
  conflictId: string;
  base: number | string | null;
  mine: number | string | null;
  theirs: number | string | null;
}

export interface CommitConflictResponse {
  ok: false;
  error: "CONFLICTS";
  conflicts: FieldConflict[];
  /** Echo back so the client can resubmit with resolutions */
  exportedFromRevision: number;
  currentRevision: number;
}

export interface CommitSuccessResponse {
  ok: true;
  newRevision: number;
  applied: {
    tbCells: number;
    adjustmentsChanged: number;
    adjustmentsAdded: number;
    adjustmentsDeleted: number;
  };
  /** True if changes from theirs were auto-merged in (no overlap). */
  autoMerged: boolean;
}

/** Per-conflict resolution choice sent back to commit. */
export interface ConflictResolution {
  conflictId: string;
  pick: "mine" | "theirs";
}
