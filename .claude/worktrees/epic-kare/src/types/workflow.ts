/**
 * Workflow Types for Orchestrator Integration
 * Matches the database enums and OpenAPI specification
 */

export type WorkflowType =
  | 'IMPORT_QUICKBOOKS_DATA'
  | 'PROCESS_DOCUMENT'
  | 'SYNC_TO_SHEET'
  | 'FULL_DATA_SYNC'
  | 'GENERATE_QOE_REPORT'
  | 'VALIDATE_ADJUSTMENTS'
  | 'REFRESH_QB_TOKEN';

export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  project_id: string;
  user_id: string;
  workflow_type: WorkflowType;
  status: WorkflowStatus;
  progress_percent: number;
  current_step: string | null;
  steps: WorkflowStep[];
  input_payload: Record<string, unknown>;
  output_payload: Record<string, unknown> | null;
  error_message: string | null;
  error_details: WorkflowErrorDetails | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface WorkflowErrorDetails {
  code: string;
  step?: string;
  recoverable: boolean;
  suggested_action?: string;
  original_error?: string;
}

// Trigger request payloads for each workflow type
export interface ImportQuickBooksPayload {
  realm_id: string;
  data_types: ('chart_of_accounts' | 'trial_balance' | 'customers' | 'vendors' | 'invoices' | 'bills')[];
  date_range?: {
    start_date: string;
    end_date: string;
  };
}

export interface ProcessDocumentPayload {
  document_id: string;
  extraction_type: 'bank_statement' | 'invoice' | 'payroll' | 'general';
  ocr_enabled?: boolean;
}

export interface SyncToSheetPayload {
  tabs: string[];
  mode: 'overwrite' | 'append' | 'merge';
}

export interface FullDataSyncPayload {
  include_quickbooks: boolean;
  include_documents: boolean;
}

export interface GenerateQoEReportPayload {
  report_type: 'full' | 'summary' | 'executive';
  periods: string[];
}

export interface ValidateAdjustmentsPayload {
  adjustment_ids: string[];
}

export type WorkflowPayload =
  | ImportQuickBooksPayload
  | ProcessDocumentPayload
  | SyncToSheetPayload
  | FullDataSyncPayload
  | GenerateQoEReportPayload
  | ValidateAdjustmentsPayload
  | Record<string, unknown>;

export interface TriggerWorkflowRequest {
  project_id: string;
  workflow_type: WorkflowType;
  payload: WorkflowPayload;
}

export interface TriggerWorkflowResponse {
  workflow_id: string;
  status: WorkflowStatus;
  message: string;
}

// Workflow list filters
export interface WorkflowListFilters {
  status?: WorkflowStatus;
  workflow_type?: WorkflowType;
  limit?: number;
  offset?: number;
}
