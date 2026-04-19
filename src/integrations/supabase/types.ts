export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      adjustment_proofs: {
        Row: {
          adjustment_id: string
          ai_analysis: Json | null
          created_at: string
          document_id: string | null
          id: string
          key_findings: string[] | null
          project_id: string
          red_flags: string[] | null
          traceability_data: Json
          updated_at: string
          user_id: string
          validated_at: string | null
          validation_score: number | null
          validation_status: Database["public"]["Enums"]["proof_validation_status"]
          verification_type: string
        }
        Insert: {
          adjustment_id: string
          ai_analysis?: Json | null
          created_at?: string
          document_id?: string | null
          id?: string
          key_findings?: string[] | null
          project_id: string
          red_flags?: string[] | null
          traceability_data?: Json
          updated_at?: string
          user_id: string
          validated_at?: string | null
          validation_score?: number | null
          validation_status?: Database["public"]["Enums"]["proof_validation_status"]
          verification_type?: string
        }
        Update: {
          adjustment_id?: string
          ai_analysis?: Json | null
          created_at?: string
          document_id?: string | null
          id?: string
          key_findings?: string[] | null
          project_id?: string
          red_flags?: string[] | null
          traceability_data?: Json
          updated_at?: string
          user_id?: string
          validated_at?: string | null
          validation_score?: number | null
          validation_status?: Database["public"]["Enums"]["proof_validation_status"]
          verification_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "adjustment_proofs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adjustment_proofs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      adjustment_proposals: {
        Row: {
          adjustment_class: string
          ai_key_signals: Json
          ai_model: string | null
          ai_prompt_version: string | null
          ai_rationale: string | null
          ai_warnings: Json
          allocation_mode: string
          block: string
          created_at: string
          description: string
          detector_run_id: string | null
          detector_type: string
          edited_amount: number | null
          edited_period_values: Json | null
          evidence_report: Json | null
          evidence_strength: string
          finding_id: string | null
          hypothesis_id: string | null
          id: string
          intent: string
          internal_score: number
          job_id: string
          linked_account_name: string | null
          linked_account_number: string | null
          master_proposal_id: string | null
          missing_evidence: Json
          period_range: Json | null
          project_id: string
          proposed_amount: number | null
          proposed_period_values: Json
          rejection_category: string | null
          rejection_reason: string | null
          review_priority: string
          reviewed_at: string | null
          reviewer_notes: string | null
          reviewer_user_id: string | null
          status: string
          support_json: Json
          support_tier: number | null
          support_tier_label: string | null
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          adjustment_class?: string
          ai_key_signals?: Json
          ai_model?: string | null
          ai_prompt_version?: string | null
          ai_rationale?: string | null
          ai_warnings?: Json
          allocation_mode?: string
          block?: string
          created_at?: string
          description?: string
          detector_run_id?: string | null
          detector_type: string
          edited_amount?: number | null
          edited_period_values?: Json | null
          evidence_report?: Json | null
          evidence_strength?: string
          finding_id?: string | null
          hypothesis_id?: string | null
          id?: string
          intent?: string
          internal_score?: number
          job_id: string
          linked_account_name?: string | null
          linked_account_number?: string | null
          master_proposal_id?: string | null
          missing_evidence?: Json
          period_range?: Json | null
          project_id: string
          proposed_amount?: number | null
          proposed_period_values?: Json
          rejection_category?: string | null
          rejection_reason?: string | null
          review_priority?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          reviewer_user_id?: string | null
          status?: string
          support_json?: Json
          support_tier?: number | null
          support_tier_label?: string | null
          template_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          adjustment_class?: string
          ai_key_signals?: Json
          ai_model?: string | null
          ai_prompt_version?: string | null
          ai_rationale?: string | null
          ai_warnings?: Json
          allocation_mode?: string
          block?: string
          created_at?: string
          description?: string
          detector_run_id?: string | null
          detector_type?: string
          edited_amount?: number | null
          edited_period_values?: Json | null
          evidence_report?: Json | null
          evidence_strength?: string
          finding_id?: string | null
          hypothesis_id?: string | null
          id?: string
          intent?: string
          internal_score?: number
          job_id?: string
          linked_account_name?: string | null
          linked_account_number?: string | null
          master_proposal_id?: string | null
          missing_evidence?: Json
          period_range?: Json | null
          project_id?: string
          proposed_amount?: number | null
          proposed_period_values?: Json
          rejection_category?: string | null
          rejection_reason?: string | null
          review_priority?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          reviewer_user_id?: string | null
          status?: string
          support_json?: Json
          support_tier?: number | null
          support_tier_label?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adjustment_proposals_detector_run_id_fkey"
            columns: ["detector_run_id"]
            isOneToOne: false
            referencedRelation: "detector_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adjustment_proposals_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adjustment_proposals_hypothesis_id_fkey"
            columns: ["hypothesis_id"]
            isOneToOne: false
            referencedRelation: "hypotheses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adjustment_proposals_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analysis_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adjustment_proposals_master_proposal_id_fkey"
            columns: ["master_proposal_id"]
            isOneToOne: false
            referencedRelation: "adjustment_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adjustment_proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notes: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          note: string
          user_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          note: string
          user_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          note?: string
          user_id?: string
        }
        Relationships: []
      }
      analysis_jobs: {
        Row: {
          attempt_number: number
          completed_at: string | null
          config_json: Json
          created_at: string | null
          detector_summary: Json
          error_message: string | null
          id: string
          job_type: string
          last_heartbeat_at: string | null
          progress_percent: number
          project_id: string
          requested_at: string
          source_summary: Json
          started_at: string | null
          status: string
          updated_at: string | null
          user_id: string
          worker_run_id: string | null
        }
        Insert: {
          attempt_number?: number
          completed_at?: string | null
          config_json?: Json
          created_at?: string | null
          detector_summary?: Json
          error_message?: string | null
          id?: string
          job_type?: string
          last_heartbeat_at?: string | null
          progress_percent?: number
          project_id: string
          requested_at?: string
          source_summary?: Json
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          worker_run_id?: string | null
        }
        Update: {
          attempt_number?: number
          completed_at?: string | null
          config_json?: Json
          created_at?: string | null
          detector_summary?: Json
          error_message?: string | null
          id?: string
          job_type?: string
          last_heartbeat_at?: string | null
          progress_percent?: number
          project_id?: string
          requested_at?: string
          source_summary?: Json
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          worker_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          business_model: Json | null
          capital_structure: Json
          cost_structure: Json
          created_at: string
          id: string
          industry_classification: string | null
          job_id: string
          metadata: Json
          operations_footprint: Json
          project_id: string
          revenue_model: Json
          source_observation_ids: string[] | null
          user_id: string
        }
        Insert: {
          business_model?: Json | null
          capital_structure?: Json
          cost_structure?: Json
          created_at?: string
          id?: string
          industry_classification?: string | null
          job_id: string
          metadata?: Json
          operations_footprint?: Json
          project_id: string
          revenue_model?: Json
          source_observation_ids?: string[] | null
          user_id: string
        }
        Update: {
          business_model?: Json | null
          capital_structure?: Json
          cost_structure?: Json
          created_at?: string
          id?: string
          industry_classification?: string | null
          job_id?: string
          metadata?: Json
          operations_footprint?: Json
          project_id?: string
          revenue_model?: Json
          source_observation_ids?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "analysis_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      canonical_transactions: {
        Row: {
          account_name: string | null
          account_number: string | null
          account_type: string | null
          amount: number | null
          amount_abs: number | null
          amount_signed: number | null
          check_number: string | null
          created_at: string
          description: string | null
          fallback_hash: string | null
          id: string
          is_year_end: boolean | null
          job_id: string | null
          memo: string | null
          payee: string | null
          posting_period: string | null
          project_id: string
          raw_payload: Json | null
          raw_reference: Json
          source_document_id: string | null
          source_processed_data_id: string | null
          source_record_id: string | null
          source_txn_id: string | null
          source_type: string
          split_account: string | null
          txn_date: string | null
          txn_type: string | null
          user_id: string
          vendor: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          account_type?: string | null
          amount?: number | null
          amount_abs?: number | null
          amount_signed?: number | null
          check_number?: string | null
          created_at?: string
          description?: string | null
          fallback_hash?: string | null
          id?: string
          is_year_end?: boolean | null
          job_id?: string | null
          memo?: string | null
          payee?: string | null
          posting_period?: string | null
          project_id: string
          raw_payload?: Json | null
          raw_reference?: Json
          source_document_id?: string | null
          source_processed_data_id?: string | null
          source_record_id?: string | null
          source_txn_id?: string | null
          source_type: string
          split_account?: string | null
          txn_date?: string | null
          txn_type?: string | null
          user_id: string
          vendor?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          account_type?: string | null
          amount?: number | null
          amount_abs?: number | null
          amount_signed?: number | null
          check_number?: string | null
          created_at?: string
          description?: string | null
          fallback_hash?: string | null
          id?: string
          is_year_end?: boolean | null
          job_id?: string | null
          memo?: string | null
          payee?: string | null
          posting_period?: string | null
          project_id?: string
          raw_payload?: Json | null
          raw_reference?: Json
          source_document_id?: string | null
          source_processed_data_id?: string | null
          source_record_id?: string | null
          source_txn_id?: string | null
          source_type?: string
          split_account?: string | null
          txn_date?: string | null
          txn_type?: string | null
          user_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canonical_transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analysis_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canonical_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          context_type: string
          created_at: string
          id: string
          metadata: Json | null
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          context_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          project_id: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          context_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_ledger: {
        Row: {
          adjustment_id: string | null
          adjustment_proposed_amount: number | null
          adjustment_title: string | null
          chain_complete: boolean
          created_at: string
          drop_reason: string | null
          dropped_at: string | null
          finding_computed_amount: number | null
          finding_id: string | null
          finding_narrative: string | null
          hypothesis_claim: string | null
          hypothesis_estimated_impact: number | null
          hypothesis_id: string | null
          id: string
          job_id: string
          metadata: Json
          observation_id: string | null
          observation_statement: string | null
          project_id: string
          tension_id: string | null
          tension_magnitude: number | null
          tension_statement: string | null
          user_id: string
        }
        Insert: {
          adjustment_id?: string | null
          adjustment_proposed_amount?: number | null
          adjustment_title?: string | null
          chain_complete?: boolean
          created_at?: string
          drop_reason?: string | null
          dropped_at?: string | null
          finding_computed_amount?: number | null
          finding_id?: string | null
          finding_narrative?: string | null
          hypothesis_claim?: string | null
          hypothesis_estimated_impact?: number | null
          hypothesis_id?: string | null
          id?: string
          job_id: string
          metadata?: Json
          observation_id?: string | null
          observation_statement?: string | null
          project_id: string
          tension_id?: string | null
          tension_magnitude?: number | null
          tension_statement?: string | null
          user_id: string
        }
        Update: {
          adjustment_id?: string | null
          adjustment_proposed_amount?: number | null
          adjustment_title?: string | null
          chain_complete?: boolean
          created_at?: string
          drop_reason?: string | null
          dropped_at?: string | null
          finding_computed_amount?: number | null
          finding_id?: string | null
          finding_narrative?: string | null
          hypothesis_claim?: string | null
          hypothesis_estimated_impact?: number | null
          hypothesis_id?: string | null
          id?: string
          job_id?: string
          metadata?: Json
          observation_id?: string | null
          observation_statement?: string | null
          project_id?: string
          tension_id?: string | null
          tension_magnitude?: number | null
          tension_statement?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_ledger_adjustment_id_fkey"
            columns: ["adjustment_id"]
            isOneToOne: false
            referencedRelation: "adjustment_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_ledger_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_ledger_hypothesis_id_fkey"
            columns: ["hypothesis_id"]
            isOneToOne: false
            referencedRelation: "hypotheses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_ledger_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analysis_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_ledger_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_ledger_tension_id_fkey"
            columns: ["tension_id"]
            isOneToOne: false
            referencedRelation: "tensions"
            referencedColumns: ["id"]
          },
        ]
      }
      company_info: {
        Row: {
          auth_code: string | null
          bearer_token: string | null
          company_name: string | null
          created_at: string
          id: string
          project_id: string
          realm_id: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auth_code?: string | null
          bearer_token?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          project_id: string
          realm_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auth_code?: string | null
          bearer_token?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          project_id?: string
          realm_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_info_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          interest: string | null
          message: string
          name: string
          role: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          interest?: string | null
          message: string
          name: string
          role?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          interest?: string | null
          message?: string
          name?: string
          role?: string | null
        }
        Relationships: []
      }
      cpa_claims: {
        Row: {
          claimed_at: string
          cpa_user_id: string
          id: string
          notes: string | null
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          claimed_at?: string
          cpa_user_id: string
          id?: string
          notes?: string | null
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          claimed_at?: string
          cpa_user_id?: string
          id?: string
          notes?: string | null
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cpa_claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_views: {
        Row: {
          id: string
          page: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          page: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          page?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      detector_runs: {
        Row: {
          candidate_count: number
          completed_at: string | null
          created_at: string
          debug_json: Json | null
          detector_type: string
          error_message: string | null
          execution_ms: number | null
          id: string
          job_id: string
          project_id: string
          proposal_count: number
          skipped_reason: string | null
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          candidate_count?: number
          completed_at?: string | null
          created_at?: string
          debug_json?: Json | null
          detector_type: string
          error_message?: string | null
          execution_ms?: number | null
          id?: string
          job_id: string
          project_id: string
          proposal_count?: number
          skipped_reason?: string | null
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          candidate_count?: number
          completed_at?: string | null
          created_at?: string
          debug_json?: Json | null
          detector_type?: string
          error_message?: string | null
          execution_ms?: number | null
          id?: string
          job_id?: string
          project_id?: string
          proposal_count?: number
          skipped_reason?: string | null
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detector_runs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analysis_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detector_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      dfy_provider_agreements: {
        Row: {
          accepted_at: string
          agreement_version: string
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          agreement_version: string
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          agreement_version?: string
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: []
      }
      docuclipper_jobs: {
        Row: {
          created_at: string
          document_id: string
          error_message: string | null
          extracted_data: Json | null
          id: string
          job_id: string
          period_end: string | null
          period_start: string | null
          project_id: string
          status: string
          transaction_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          error_message?: string | null
          extracted_data?: Json | null
          id?: string
          job_id: string
          period_end?: string | null
          period_start?: string | null
          project_id: string
          status?: string
          transaction_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          error_message?: string | null
          extracted_data?: Json | null
          id?: string
          job_id?: string
          period_end?: string | null
          period_start?: string | null
          project_id?: string
          status?: string
          transaction_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "docuclipper_jobs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "docuclipper_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          account_label: string | null
          account_type: string | null
          category: string | null
          company_name: string | null
          coverage_validated: boolean | null
          created_at: string | null
          description: string | null
          docuclipper_job_id: string | null
          document_ids: string | null
          document_type: string | null
          extracted_data: Json | null
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          institution: string | null
          job_id: string | null
          name: string
          parsed_summary: Json | null
          period_end: string | null
          period_start: string | null
          processing_status: string | null
          project_id: string
          status: string | null
          user_id: string
          validated_at: string | null
          validation_result: Json | null
        }
        Insert: {
          account_label?: string | null
          account_type?: string | null
          category?: string | null
          company_name?: string | null
          coverage_validated?: boolean | null
          created_at?: string | null
          description?: string | null
          docuclipper_job_id?: string | null
          document_ids?: string | null
          document_type?: string | null
          extracted_data?: Json | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          institution?: string | null
          job_id?: string | null
          name: string
          parsed_summary?: Json | null
          period_end?: string | null
          period_start?: string | null
          processing_status?: string | null
          project_id: string
          status?: string | null
          user_id: string
          validated_at?: string | null
          validation_result?: Json | null
        }
        Update: {
          account_label?: string | null
          account_type?: string | null
          category?: string | null
          company_name?: string | null
          coverage_validated?: boolean | null
          created_at?: string | null
          description?: string | null
          docuclipper_job_id?: string | null
          document_ids?: string | null
          document_type?: string | null
          extracted_data?: Json | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          institution?: string | null
          job_id?: string | null
          name?: string
          parsed_summary?: Json | null
          period_end?: string | null
          period_start?: string | null
          processing_status?: string | null
          project_id?: string
          status?: string | null
          user_id?: string
          validated_at?: string | null
          validation_result?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_nodes: {
        Row: {
          aliases: string[] | null
          canonical_name: string | null
          created_at: string
          entity_type: string | null
          id: string
          job_id: string
          linked_accounts: Json
          linked_txn_count: number | null
          linked_txn_total: number | null
          metadata: Json
          project_id: string
          roles: string[] | null
          transaction_volume: number | null
          user_id: string
        }
        Insert: {
          aliases?: string[] | null
          canonical_name?: string | null
          created_at?: string
          entity_type?: string | null
          id?: string
          job_id: string
          linked_accounts?: Json
          linked_txn_count?: number | null
          linked_txn_total?: number | null
          metadata?: Json
          project_id: string
          roles?: string[] | null
          transaction_volume?: number | null
          user_id: string
        }
        Update: {
          aliases?: string[] | null
          canonical_name?: string | null
          created_at?: string
          entity_type?: string | null
          id?: string
          job_id?: string
          linked_accounts?: Json
          linked_txn_count?: number | null
          linked_txn_total?: number | null
          metadata?: Json
          project_id?: string
          roles?: string[] | null
          transaction_volume?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_nodes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analysis_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      findings: {
        Row: {
          accounts_involved: string[] | null
          adjustment_class: string | null
          alternative_explanations_considered: string[] | null
          assumptions: string[] | null
          computed_amount: number | null
          created_at: string
          direction: string | null
          evidence_strength: string
          hypothesis_id: string | null
          hypothesis_outcome: string | null
          id: string
          identified_items: Json | null
          job_id: string
          key_signals: string[] | null
          metadata: Json
          narrative: string | null
          outcome_explanation: string | null
          period_values: Json
          project_id: string
          resolver_type: string | null
          title: string | null
          user_id: string
          what_we_cannot_verify: string[] | null
        }
        Insert: {
          accounts_involved?: string[] | null
          adjustment_class?: string | null
          alternative_explanations_considered?: string[] | null
          assumptions?: string[] | null
          computed_amount?: number | null
          created_at?: string
          direction?: string | null
          evidence_strength?: string
          hypothesis_id?: string | null
          hypothesis_outcome?: string | null
          id?: string
          identified_items?: Json | null
          job_id: string
          key_signals?: string[] | null
          metadata?: Json
          narrative?: string | null
          outcome_explanation?: string | null
          period_values?: Json
          project_id: string
          resolver_type?: string | null
          title?: string | null
          user_id: string
          what_we_cannot_verify?: string[] | null
        }
        Update: {
          accounts_involved?: string[] | null
          adjustment_class?: string | null
          alternative_explanations_considered?: string[] | null
          assumptions?: string[] | null
          computed_amount?: number | null
          created_at?: string
          direction?: string | null
          evidence_strength?: string
          hypothesis_id?: string | null
          hypothesis_outcome?: string | null
          id?: string
          identified_items?: Json | null
          job_id?: string
          key_signals?: string[] | null
          metadata?: Json
          narrative?: string | null
          outcome_explanation?: string | null
          period_values?: Json
          project_id?: string
          resolver_type?: string | null
          title?: string | null
          user_id?: string
          what_we_cannot_verify?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "findings_hypothesis_id_fkey"
            columns: ["hypothesis_id"]
            isOneToOne: false
            referencedRelation: "hypotheses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "findings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analysis_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      flagged_transactions: {
        Row: {
          account_name: string
          ai_analysis: Json | null
          amount: number
          classification_context: Json | null
          confidence_score: number
          created_at: string
          description: string
          flag_category: string
          flag_reason: string
          flag_type: string
          id: string
          project_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          source_data: Json | null
          status: string
          suggested_adjustment_amount: number | null
          suggested_adjustment_type: string | null
          transaction_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          ai_analysis?: Json | null
          amount: number
          classification_context?: Json | null
          confidence_score?: number
          created_at?: string
          description: string
          flag_category?: string
          flag_reason: string
          flag_type: string
          id?: string
          project_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_data?: Json | null
          status?: string
          suggested_adjustment_amount?: number | null
          suggested_adjustment_type?: string | null
          transaction_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          ai_analysis?: Json | null
          amount?: number
          classification_context?: Json | null
          confidence_score?: number
          created_at?: string
          description?: string
          flag_category?: string
          flag_reason?: string
          flag_type?: string
          id?: string
          project_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_data?: Json | null
          status?: string
          suggested_adjustment_amount?: number | null
          suggested_adjustment_type?: string | null
          transaction_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flagged_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      hypotheses: {
        Row: {
          alternative_explanations: string[] | null
          category: string | null
          created_at: string
          estimated_ebitda_impact: number | null
          falsification_conditions: Json
          final_ebitda_impact: number | null
          hypothesis_claim: string | null
          id: string
          impact_direction: string | null
          job_id: string
          metadata: Json
          owned_accounts: string[] | null
          project_id: string
          required_resolvers: string[] | null
          resolution_plan: Json
          resolution_result: string | null
          resolved_at: string | null
          severity: string | null
          status: string
          supporting_observation_ids: string[] | null
          tension_ids: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alternative_explanations?: string[] | null
          category?: string | null
          created_at?: string
          estimated_ebitda_impact?: number | null
          falsification_conditions?: Json
          final_ebitda_impact?: number | null
          hypothesis_claim?: string | null
          id?: string
          impact_direction?: string | null
          job_id: string
          metadata?: Json
          owned_accounts?: string[] | null
          project_id: string
          required_resolvers?: string[] | null
          resolution_plan?: Json
          resolution_result?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string
          supporting_observation_ids?: string[] | null
          tension_ids?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alternative_explanations?: string[] | null
          category?: string | null
          created_at?: string
          estimated_ebitda_impact?: number | null
          falsification_conditions?: Json
          final_ebitda_impact?: number | null
          hypothesis_claim?: string | null
          id?: string
          impact_direction?: string | null
          job_id?: string
          metadata?: Json
          owned_accounts?: string[] | null
          project_id?: string
          required_resolvers?: string[] | null
          resolution_plan?: Json
          resolution_result?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string
          supporting_observation_ids?: string[] | null
          tension_ids?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hypotheses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analysis_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      nudge_log: {
        Row: {
          email_id: string | null
          id: string
          nudge_type: string
          sent_at: string
          user_id: string
        }
        Insert: {
          email_id?: string | null
          id?: string
          nudge_type: string
          sent_at?: string
          user_id: string
        }
        Update: {
          email_id?: string | null
          id?: string
          nudge_type?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      observations: {
        Row: {
          category: string | null
          confidence_basis: string | null
          created_at: string
          id: string
          job_id: string
          metadata: Json
          period: string | null
          project_id: string
          source: string | null
          statement: string | null
          supporting_accounts: string[] | null
          supporting_evidence: string[] | null
          unit: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          category?: string | null
          confidence_basis?: string | null
          created_at?: string
          id?: string
          job_id: string
          metadata?: Json
          period?: string | null
          project_id: string
          source?: string | null
          statement?: string | null
          supporting_accounts?: string[] | null
          supporting_evidence?: string[] | null
          unit?: string | null
          user_id: string
          value?: number | null
        }
        Update: {
          category?: string | null
          confidence_basis?: string | null
          created_at?: string
          id?: string
          job_id?: string
          metadata?: Json
          period?: string | null
          project_id?: string
          source?: string | null
          statement?: string | null
          supporting_accounts?: string[] | null
          supporting_evidence?: string[] | null
          unit?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "observations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analysis_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_data: {
        Row: {
          created_at: string
          data: Json
          data_type: string
          id: string
          period_end: string | null
          period_start: string | null
          project_id: string
          qb_realm_id: string | null
          record_count: number | null
          source_document_id: string | null
          source_type: string
          updated_at: string
          user_id: string
          validation_status: string
        }
        Insert: {
          created_at?: string
          data?: Json
          data_type: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          project_id: string
          qb_realm_id?: string | null
          record_count?: number | null
          source_document_id?: string | null
          source_type: string
          updated_at?: string
          user_id: string
          validation_status?: string
        }
        Update: {
          created_at?: string
          data?: Json
          data_type?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          project_id?: string
          qb_realm_id?: string | null
          record_count?: number | null
          source_document_id?: string | null
          source_type?: string
          updated_at?: string
          user_id?: string
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "processed_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processed_data_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_webhook_events: {
        Row: {
          event_id: string
          processed_at: string
        }
        Insert: {
          event_id: string
          processed_at?: string
        }
        Update: {
          event_id?: string
          processed_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      project_data_chunks: {
        Row: {
          chunk_key: string
          content: string
          created_at: string
          data_type: string
          embedding: string | null
          fs_section: string | null
          id: string
          metadata: Json | null
          period: string | null
          project_id: string
          token_count: number | null
          updated_at: string
        }
        Insert: {
          chunk_key: string
          content: string
          created_at?: string
          data_type: string
          embedding?: string | null
          fs_section?: string | null
          id?: string
          metadata?: Json | null
          period?: string | null
          project_id: string
          token_count?: number | null
          updated_at?: string
        }
        Update: {
          chunk_key?: string
          content?: string
          created_at?: string
          data_type?: string
          embedding?: string | null
          fs_section?: string | null
          id?: string
          metadata?: Json | null
          period?: string | null
          project_id?: string
          token_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_data_chunks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_payments: {
        Row: {
          amount: number
          created_at: string | null
          expires_at: string | null
          id: string
          paid_at: string | null
          project_id: string
          status: string
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          project_id: string
          status?: string
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          project_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_shares: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          project_id: string
          role: string
          shared_with_email: string
          shared_with_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id: string
          role?: string
          shared_with_email: string
          shared_with_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_id?: string
          role?: string
          shared_with_email?: string
          shared_with_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_shares_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_name: string | null
          created_at: string | null
          credit_expires_at: string | null
          current_phase: number | null
          current_section: number | null
          fiscal_year_end: string | null
          funded_by_credit: boolean
          google_sheet_id: string | null
          google_sheet_url: string | null
          id: string
          industry: string | null
          name: string
          periods: Json | null
          service_tier: string
          status: string | null
          target_company: string | null
          transaction_type: string | null
          updated_at: string | null
          user_id: string
          wizard_data: Json | null
        }
        Insert: {
          client_name?: string | null
          created_at?: string | null
          credit_expires_at?: string | null
          current_phase?: number | null
          current_section?: number | null
          fiscal_year_end?: string | null
          funded_by_credit?: boolean
          google_sheet_id?: string | null
          google_sheet_url?: string | null
          id?: string
          industry?: string | null
          name: string
          periods?: Json | null
          service_tier?: string
          status?: string | null
          target_company?: string | null
          transaction_type?: string | null
          updated_at?: string | null
          user_id: string
          wizard_data?: Json | null
        }
        Update: {
          client_name?: string | null
          created_at?: string | null
          credit_expires_at?: string | null
          current_phase?: number | null
          current_section?: number | null
          fiscal_year_end?: string | null
          funded_by_credit?: boolean
          google_sheet_id?: string | null
          google_sheet_url?: string | null
          id?: string
          industry?: string | null
          name?: string
          periods?: Json | null
          service_tier?: string
          status?: string | null
          target_company?: string | null
          transaction_type?: string | null
          updated_at?: string | null
          user_id?: string
          wizard_data?: Json | null
        }
        Relationships: []
      }
      promo_config: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: number
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: number
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      proposal_evidence: {
        Row: {
          account_name: string | null
          account_number: string | null
          amount: number | null
          canonical_txn_id: string | null
          created_at: string
          description: string | null
          fallback_hash: string | null
          id: string
          match_quality: string
          proposal_id: string
          raw_reference: Json
          reason: string | null
          source_txn_id: string | null
          source_type: string
          txn_date: string | null
          vendor: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          amount?: number | null
          canonical_txn_id?: string | null
          created_at?: string
          description?: string | null
          fallback_hash?: string | null
          id?: string
          match_quality?: string
          proposal_id: string
          raw_reference?: Json
          reason?: string | null
          source_txn_id?: string | null
          source_type: string
          txn_date?: string | null
          vendor?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          amount?: number | null
          canonical_txn_id?: string | null
          created_at?: string
          description?: string | null
          fallback_hash?: string | null
          id?: string
          match_quality?: string
          proposal_id?: string
          raw_reference?: Json
          reason?: string | null
          source_txn_id?: string | null
          source_type?: string
          txn_date?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_evidence_canonical_txn_id_fkey"
            columns: ["canonical_txn_id"]
            isOneToOne: false
            referencedRelation: "canonical_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_evidence_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "adjustment_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      qb_sync_requests: {
        Row: {
          last_requested_at: string
          project_id: string
          request_count: number
        }
        Insert: {
          last_requested_at?: string
          project_id: string
          request_count?: number
        }
        Update: {
          last_requested_at?: string
          project_id?: string
          request_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "qb_sync_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_chunks: {
        Row: {
          authority_weight: number | null
          chapter: string | null
          chunk_index: number
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          page_number: number | null
          section: string | null
          source: string
          source_license: string | null
          source_title: string | null
          token_count: number | null
          topic_tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          authority_weight?: number | null
          chapter?: string | null
          chunk_index: number
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          page_number?: number | null
          section?: string | null
          source: string
          source_license?: string | null
          source_title?: string | null
          token_count?: number | null
          topic_tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          authority_weight?: number | null
          chapter?: string | null
          chunk_index?: number
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          page_number?: number | null
          section?: string | null
          source?: string
          source_license?: string | null
          source_title?: string | null
          token_count?: number | null
          topic_tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reclassification_jobs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          input_payload: Json
          project_id: string
          result: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          input_payload?: Json
          project_id: string
          result?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          input_payload?: Json
          project_id?: string
          result?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reclassification_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tensions: {
        Row: {
          accounts_implicated: string[] | null
          actual_value: number | null
          benchmark_source: string | null
          category: string | null
          created_at: string
          direction: string | null
          expected_value: number | null
          gap_percent: number | null
          id: string
          job_id: string
          magnitude: number | null
          magnitude_basis: string | null
          metadata: Json
          observation_ids: string[] | null
          project_id: string
          severity: string | null
          statement: string | null
          user_id: string
        }
        Insert: {
          accounts_implicated?: string[] | null
          actual_value?: number | null
          benchmark_source?: string | null
          category?: string | null
          created_at?: string
          direction?: string | null
          expected_value?: number | null
          gap_percent?: number | null
          id?: string
          job_id: string
          magnitude?: number | null
          magnitude_basis?: string | null
          metadata?: Json
          observation_ids?: string[] | null
          project_id: string
          severity?: string | null
          statement?: string | null
          user_id: string
        }
        Update: {
          accounts_implicated?: string[] | null
          actual_value?: number | null
          benchmark_source?: string | null
          category?: string | null
          created_at?: string
          direction?: string | null
          expected_value?: number | null
          gap_percent?: number | null
          id?: string
          job_id?: string
          magnitude?: number | null
          magnitude_basis?: string | null
          metadata?: Json
          observation_ids?: string[] | null
          project_id?: string
          severity?: string | null
          statement?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tensions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "analysis_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      tos_acceptances: {
        Row: {
          accepted_at: string
          id: string
          ip_address: string | null
          tos_version: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          ip_address?: string | null
          tos_version: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          id?: string
          ip_address?: string | null
          tos_version?: string
          user_id?: string
        }
        Relationships: []
      }
      upload_errors: {
        Row: {
          context: string
          created_at: string
          error_code: string | null
          error_details: Json | null
          error_message: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          id: string
          project_id: string | null
          stage: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          context: string
          created_at?: string
          error_code?: string | null
          error_details?: Json | null
          error_message?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id?: string | null
          stage: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          context?: string
          created_at?: string
          error_code?: string | null
          error_details?: Json | null
          error_message?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id?: string | null
          stage?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          credit_type: string
          credits_remaining: number
          id: string
          total_credits_purchased: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credit_type?: string
          credits_remaining?: number
          id?: string
          total_credits_purchased?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credit_type?: string
          credits_remaining?: number
          id?: string
          total_credits_purchased?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_attempts: {
        Row: {
          account_hints: string[] | null
          adjustment_class: string | null
          adjustment_description: string
          ai_summary: string | null
          contradictions: Json | null
          created_at: string
          data_gaps: Json | null
          diagnostic_data: Json
          id: string
          job_id: string | null
          matching_txn_count: number
          notes: string | null
          period: string | null
          project_id: string
          proposal_id: string | null
          proposed_amount: number
          schema_hints: Json | null
          source_data_version: Json | null
          status: string
          variance_amount: number
          verified_amount: number
          verified_at: string
          verified_by_user_id: string | null
        }
        Insert: {
          account_hints?: string[] | null
          adjustment_class?: string | null
          adjustment_description: string
          ai_summary?: string | null
          contradictions?: Json | null
          created_at?: string
          data_gaps?: Json | null
          diagnostic_data?: Json
          id?: string
          job_id?: string | null
          matching_txn_count?: number
          notes?: string | null
          period?: string | null
          project_id: string
          proposal_id?: string | null
          proposed_amount: number
          schema_hints?: Json | null
          source_data_version?: Json | null
          status: string
          variance_amount: number
          verified_amount: number
          verified_at?: string
          verified_by_user_id?: string | null
        }
        Update: {
          account_hints?: string[] | null
          adjustment_class?: string | null
          adjustment_description?: string
          ai_summary?: string | null
          contradictions?: Json | null
          created_at?: string
          data_gaps?: Json | null
          diagnostic_data?: Json
          id?: string
          job_id?: string | null
          matching_txn_count?: number
          notes?: string | null
          period?: string | null
          project_id?: string
          proposal_id?: string | null
          proposed_amount?: number
          schema_hints?: Json | null
          source_data_version?: Json | null
          status?: string
          variance_amount?: number
          verified_amount?: number
          verified_at?: string
          verified_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_attempts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "adjustment_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_transaction_snapshots: {
        Row: {
          account_name: string | null
          account_number: string | null
          amount_abs: number | null
          amount_signed: number | null
          counterparty: string | null
          created_at: string
          description: string | null
          id: string
          matched_reason: string | null
          raw_transaction: Json
          source_document_id: string | null
          source_type: string | null
          transaction_id: string | null
          txn_date: string | null
          verification_attempt_id: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          amount_abs?: number | null
          amount_signed?: number | null
          counterparty?: string | null
          created_at?: string
          description?: string | null
          id?: string
          matched_reason?: string | null
          raw_transaction: Json
          source_document_id?: string | null
          source_type?: string | null
          transaction_id?: string | null
          txn_date?: string | null
          verification_attempt_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          amount_abs?: number | null
          amount_signed?: number | null
          counterparty?: string | null
          created_at?: string
          description?: string | null
          id?: string
          matched_reason?: string | null
          raw_transaction?: Json
          source_document_id?: string | null
          source_type?: string | null
          transaction_id?: string | null
          txn_date?: string | null
          verification_attempt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_transaction_snapshots_verification_attempt_id_fkey"
            columns: ["verification_attempt_id"]
            isOneToOne: false
            referencedRelation: "verification_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      whitelisted_users: {
        Row: {
          added_by: string | null
          created_at: string
          email: string
          id: string
          notes: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          email: string
          id?: string
          notes?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
        }
        Relationships: []
      }
      workflows: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: string | null
          error_details: Json | null
          error_message: string | null
          id: string
          input_payload: Json
          output_payload: Json | null
          progress_percent: number
          project_id: string
          retry_count: number
          started_at: string | null
          status: Database["public"]["Enums"]["workflow_status"]
          steps: Json
          updated_at: string
          user_id: string
          workflow_type: Database["public"]["Enums"]["workflow_type"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: string | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          input_payload?: Json
          output_payload?: Json | null
          progress_percent?: number
          project_id: string
          retry_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["workflow_status"]
          steps?: Json
          updated_at?: string
          user_id: string
          workflow_type: Database["public"]["Enums"]["workflow_type"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: string | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          input_payload?: Json
          output_payload?: Json | null
          progress_percent?: number
          project_id?: string
          retry_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["workflow_status"]
          steps?: Json
          updated_at?: string
          user_id?: string
          workflow_type?: Database["public"]["Enums"]["workflow_type"]
        }
        Relationships: [
          {
            foreignKeyName: "workflows_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      duplicate_project: {
        Args: { _new_name?: string; _source_project_id: string }
        Returns: string
      }
      fetch_processed_data_chunked: {
        Args: {
          _chunk_size?: number
          _data_type: string
          _offset?: number
          _project_id: string
        }
        Returns: {
          created_at: string
          data: Json
          data_type: string
          id: string
          period_end: string | null
          period_start: string | null
          project_id: string
          qb_realm_id: string | null
          record_count: number | null
          source_document_id: string | null
          source_type: string
          updated_at: string
          user_id: string
          validation_status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "processed_data"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      fetch_processed_data_ids: {
        Args: { _data_type: string; _project_id: string }
        Returns: {
          id: string
          period_end: string
          period_start: string
          record_count: number
          source_type: string
        }[]
      }
      get_project_role: {
        Args: { _project_id: string; _user_id: string }
        Returns: string
      }
      get_user_engagement_stats: {
        Args: never
        Returns: {
          company: string
          document_count: number
          email: string
          full_name: string
          has_completed_onboarding: boolean
          has_qb_connection: boolean
          last_sign_in_at: string
          project_count: number
          signed_up_at: string
          user_id: string
        }[]
      }
      has_project_access:
        | { Args: { _project_id: string }; Returns: boolean }
        | { Args: { _project_id: string; _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_project_chunks:
        | {
            Args: {
              _project_id: string
              data_type_filter?: string[]
              match_count?: number
              match_threshold?: number
              query_embedding: string
            }
            Returns: {
              content: string
              data_type: string
              fs_section: string
              id: string
              metadata: Json
              period: string
              similarity: number
              token_count: number
            }[]
          }
        | {
            Args: {
              _project_id: string
              data_type_filter?: string[]
              match_count?: number
              match_threshold?: number
              query_embedding: string
            }
            Returns: {
              content: string
              data_type: string
              fs_section: string
              id: string
              metadata: Json
              period: string
              similarity: number
              token_count: number
            }[]
          }
      match_rag_chunks: {
        Args: {
          match_count?: number
          match_threshold?: number
          min_authority?: number
          query_embedding: string
          source_filter?: string[]
          topic_filter?: string[]
        }
        Returns: {
          authority_weight: number
          chapter: string
          content: string
          id: string
          page_number: number
          section: string
          similarity: number
          source: string
          source_title: string
        }[]
      }
      reset_project_data: { Args: { p_project_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "cpa"
      proof_validation_status:
        | "validated"
        | "supported"
        | "partial"
        | "insufficient"
        | "contradictory"
        | "pending"
      workflow_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
      workflow_type:
        | "IMPORT_QUICKBOOKS_DATA"
        | "PROCESS_DOCUMENT"
        | "SYNC_TO_SHEET"
        | "FULL_DATA_SYNC"
        | "GENERATE_QOE_REPORT"
        | "VALIDATE_ADJUSTMENTS"
        | "REFRESH_QB_TOKEN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "cpa"],
      proof_validation_status: [
        "validated",
        "supported",
        "partial",
        "insufficient",
        "contradictory",
        "pending",
      ],
      workflow_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "cancelled",
      ],
      workflow_type: [
        "IMPORT_QUICKBOOKS_DATA",
        "PROCESS_DOCUMENT",
        "SYNC_TO_SHEET",
        "FULL_DATA_SYNC",
        "GENERATE_QOE_REPORT",
        "VALIDATE_ADJUSTMENTS",
        "REFRESH_QB_TOKEN",
      ],
    },
  },
} as const
