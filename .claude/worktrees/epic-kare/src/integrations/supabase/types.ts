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
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
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
      flagged_transactions: {
        Row: {
          account_name: string
          ai_analysis: Json | null
          amount: number
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
      user_credits: {
        Row: {
          created_at: string
          credits_remaining: number
          id: string
          total_credits_purchased: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_remaining?: number
          id?: string
          total_credits_purchased?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
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
      get_project_role: {
        Args: { _project_id: string; _user_id: string }
        Returns: string
      }
      has_project_access: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
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
