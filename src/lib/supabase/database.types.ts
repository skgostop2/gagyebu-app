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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_recommendations: {
        Row: {
          analysis_period_end: string
          analysis_period_start: string
          created_at: string
          created_by: string
          disclaimer: string
          household_id: string
          id: string
          input_hash: string
          response_text: string
          scenario_id: string | null
        }
        Insert: {
          analysis_period_end: string
          analysis_period_start: string
          created_at?: string
          created_by: string
          disclaimer?: string
          household_id: string
          id?: string
          input_hash: string
          response_text: string
          scenario_id?: string | null
        }
        Update: {
          analysis_period_end?: string
          analysis_period_start?: string
          created_at?: string
          created_by?: string
          disclaimer?: string
          household_id?: string
          id?: string
          input_hash?: string
          response_text?: string
          scenario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendations_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "income_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          created_at: string
          household_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_snapshots: {
        Row: {
          cash_equivalent: number
          created_at: string
          created_by: string
          household_id: string
          id: string
          investment_assets: number
          net_worth: number
          real_assets: number
          snapshot_month: string
          total_assets: number
          total_liabilities: number
        }
        Insert: {
          cash_equivalent?: number
          created_at?: string
          created_by: string
          household_id: string
          id?: string
          investment_assets?: number
          net_worth?: number
          real_assets?: number
          snapshot_month: string
          total_assets?: number
          total_liabilities?: number
        }
        Update: {
          cash_equivalent?: number
          created_at?: string
          created_by?: string
          household_id?: string
          id?: string
          investment_assets?: number
          net_worth?: number
          real_assets?: number
          snapshot_month?: string
          total_assets?: number
          total_liabilities?: number
        }
        Relationships: [
          {
            foreignKeyName: "asset_snapshots_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          acquired_at: string | null
          category: string
          created_at: string
          created_by: string
          current_valuation: number
          deleted_at: string | null
          household_id: string
          id: string
          initial_amount: number
          institution: string | null
          is_shared: boolean
          kind: string
          maturity_date: string | null
          memo: string | null
          name: string
          owner_member_id: string | null
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          acquired_at?: string | null
          category: string
          created_at?: string
          created_by: string
          current_valuation?: number
          deleted_at?: string | null
          household_id: string
          id?: string
          initial_amount?: number
          institution?: string | null
          is_shared?: boolean
          kind: string
          maturity_date?: string | null
          memo?: string | null
          name: string
          owner_member_id?: string | null
          status?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          acquired_at?: string | null
          category?: string
          created_at?: string
          created_by?: string
          current_valuation?: number
          deleted_at?: string | null
          household_id?: string
          id?: string
          initial_amount?: number
          institution?: string | null
          is_shared?: boolean
          kind?: string
          maturity_date?: string | null
          memo?: string | null
          name?: string
          owner_member_id?: string | null
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_owner_member_id_fkey"
            columns: ["owner_member_id"]
            isOneToOne: false
            referencedRelation: "household_members"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          after_data: Json | null
          before_data: Json | null
          changed_at: string
          changed_by: string | null
          household_id: string
          id: string
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          after_data?: Json | null
          before_data?: Json | null
          changed_at?: string
          changed_by?: string | null
          household_id: string
          id?: string
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          after_data?: Json | null
          before_data?: Json | null
          changed_at?: string
          changed_by?: string | null
          household_id?: string
          id?: string
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          alert_thresholds: number[]
          created_at: string
          created_by: string
          deleted_at: string | null
          household_id: string
          id: string
          last_alert_threshold: number | null
          limit_amount: number
          memo: string | null
          period_end: string
          period_start: string
          scope: string
          status: string
          target_category_id: string | null
          target_member_id: string | null
          updated_at: string
        }
        Insert: {
          alert_thresholds?: number[]
          created_at?: string
          created_by: string
          deleted_at?: string | null
          household_id: string
          id?: string
          last_alert_threshold?: number | null
          limit_amount: number
          memo?: string | null
          period_end: string
          period_start: string
          scope: string
          status?: string
          target_category_id?: string | null
          target_member_id?: string | null
          updated_at?: string
        }
        Update: {
          alert_thresholds?: number[]
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          household_id?: string
          id?: string
          last_alert_threshold?: number | null
          limit_amount?: number
          memo?: string | null
          period_end?: string
          period_start?: string
          scope?: string
          status?: string
          target_category_id?: string | null
          target_member_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_target_category_id_fkey"
            columns: ["target_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_target_member_id_fkey"
            columns: ["target_member_id"]
            isOneToOne: false
            referencedRelation: "household_members"
            referencedColumns: ["id"]
          },
        ]
      }
      card_transactions: {
        Row: {
          actual_user_member_id: string | null
          actual_user_scope: string
          amount: number
          billing_month: string
          card_id: string
          category_id: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          household_id: string
          id: string
          installment_months: number
          is_installment: boolean
          memo: string | null
          merchant: string
          monthly_fee: number
          occurred_at: string
          status: string
          updated_at: string
        }
        Insert: {
          actual_user_member_id?: string | null
          actual_user_scope?: string
          amount: number
          billing_month: string
          card_id: string
          category_id?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          household_id: string
          id?: string
          installment_months?: number
          is_installment?: boolean
          memo?: string | null
          merchant: string
          monthly_fee?: number
          occurred_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          actual_user_member_id?: string | null
          actual_user_scope?: string
          amount?: number
          billing_month?: string
          card_id?: string
          category_id?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          household_id?: string
          id?: string
          installment_months?: number
          is_installment?: boolean
          memo?: string | null
          merchant?: string
          monthly_fee?: number
          occurred_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_transactions_actual_user_member_id_fkey"
            columns: ["actual_user_member_id"]
            isOneToOne: false
            referencedRelation: "household_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          alias: string
          billing_day: number
          card_type: string
          created_at: string
          created_by: string
          deleted_at: string | null
          household_id: string
          id: string
          is_shared: boolean
          issuer: string
          last4: string
          memo: string | null
          monthly_limit: number | null
          owner_member_id: string | null
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          alias: string
          billing_day: number
          card_type: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          household_id: string
          id?: string
          is_shared?: boolean
          issuer: string
          last4: string
          memo?: string | null
          monthly_limit?: number | null
          owner_member_id?: string | null
          status?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          alias?: string
          billing_day?: number
          card_type?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          household_id?: string
          id?: string
          is_shared?: boolean
          issuer?: string
          last4?: string
          memo?: string | null
          monthly_limit?: number | null
          owner_member_id?: string | null
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_owner_member_id_fkey"
            columns: ["owner_member_id"]
            isOneToOne: false
            referencedRelation: "household_members"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          created_by: string
          deleted_at: string | null
          household_id: string
          icon: string
          id: string
          is_active: boolean
          is_default: boolean
          kind: string
          name: string
          parent_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          household_id: string
          icon?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          kind: string
          name: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          household_id?: string
          icon?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          kind?: string
          name?: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      household_ai_config: {
        Row: {
          api_key: string
          household_id: string
          model: string | null
          provider: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          api_key: string
          household_id: string
          model?: string | null
          provider: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          api_key?: string
          household_id?: string
          model?: string | null
          provider?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "household_ai_config_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: true
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_invitations: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string
          household_id: string
          id: string
          invited_role: string
          max_uses: number
          status: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          expires_at: string
          household_id: string
          id?: string
          invited_role: string
          max_uses?: number
          status?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          household_id?: string
          id?: string
          invited_role?: string
          max_uses?: number
          status?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "household_invitations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          display_name: string
          household_id: string
          id: string
          joined_at: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          display_name: string
          household_id: string
          id?: string
          joined_at?: string
          role: string
          status?: string
          user_id: string
        }
        Update: {
          display_name?: string
          household_id?: string
          id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          currency: string
          deleted_at: string | null
          fiscal_month_start_day: number
          id: string
          member_count: number
          name: string
          owner_user_id: string
          plan_code: string
          representative_member_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          deleted_at?: string | null
          fiscal_month_start_day?: number
          id?: string
          member_count?: number
          name: string
          owner_user_id: string
          plan_code?: string
          representative_member_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          deleted_at?: string | null
          fiscal_month_start_day?: number
          id?: string
          member_count?: number
          name?: string
          owner_user_id?: string
          plan_code?: string
          representative_member_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "households_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "households_representative_member_fk"
            columns: ["representative_member_id"]
            isOneToOne: false
            referencedRelation: "household_members"
            referencedColumns: ["id"]
          },
        ]
      }
      income_scenarios: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          effective_from: string
          household_id: string
          id: string
          is_active: boolean
          kind: string
          memo: string | null
          name: string
          projected_monthly_income: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          effective_from: string
          household_id: string
          id?: string
          is_active?: boolean
          kind: string
          memo?: string | null
          name: string
          projected_monthly_income: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          effective_from?: string
          household_id?: string
          id?: string
          is_active?: boolean
          kind?: string
          memo?: string | null
          name?: string
          projected_monthly_income?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_scenarios_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          admin_reply: string | null
          answered_at: string | null
          answered_by: string | null
          created_at: string
          email: string
          household_id: string | null
          id: string
          message: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          answered_at?: string | null
          answered_by?: string | null
          created_at?: string
          email: string
          household_id?: string | null
          id?: string
          message: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          answered_at?: string | null
          answered_by?: string | null
          created_at?: string
          email?: string
          household_id?: string | null
          id?: string
          message?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          created_at: string
          created_by: string
          current_valuation: number
          deleted_at: string | null
          household_id: string
          id: string
          institution: string
          investment_type: string
          last_valuation_date: string
          memo: string | null
          owner_member_id: string | null
          principal: number
          product_name: string
          purchase_date: string
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_valuation?: number
          deleted_at?: string | null
          household_id: string
          id?: string
          institution: string
          investment_type: string
          last_valuation_date: string
          memo?: string | null
          owner_member_id?: string | null
          principal?: number
          product_name: string
          purchase_date: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_valuation?: number
          deleted_at?: string | null
          household_id?: string
          id?: string
          institution?: string
          investment_type?: string
          last_valuation_date?: string
          memo?: string | null
          owner_member_id?: string | null
          principal?: number
          product_name?: string
          purchase_date?: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_owner_member_id_fkey"
            columns: ["owner_member_id"]
            isOneToOne: false
            referencedRelation: "household_members"
            referencedColumns: ["id"]
          },
        ]
      }
      liabilities: {
        Row: {
          created_at: string
          created_by: string
          current_balance: number
          debtor_member_id: string | null
          deleted_at: string | null
          household_id: string
          id: string
          institution: string
          interest_rate: number
          kind: string
          maturity_date: string | null
          memo: string | null
          monthly_payment: number
          name: string
          original_amount: number
          payment_due_day: number | null
          start_date: string
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_balance?: number
          debtor_member_id?: string | null
          deleted_at?: string | null
          household_id: string
          id?: string
          institution: string
          interest_rate?: number
          kind: string
          maturity_date?: string | null
          memo?: string | null
          monthly_payment?: number
          name: string
          original_amount: number
          payment_due_day?: number | null
          start_date: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_balance?: number
          debtor_member_id?: string | null
          deleted_at?: string | null
          household_id?: string
          id?: string
          institution?: string
          interest_rate?: number
          kind?: string
          maturity_date?: string | null
          memo?: string | null
          monthly_payment?: number
          name?: string
          original_amount?: number
          payment_due_day?: number | null
          start_date?: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "liabilities_debtor_member_id_fkey"
            columns: ["debtor_member_id"]
            isOneToOne: false
            referencedRelation: "household_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liabilities_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_fee_items: {
        Row: {
          amount: number
          created_at: string
          household_id: string
          id: string
          kind: string
          maintenance_fee_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          household_id: string
          id?: string
          kind: string
          maintenance_fee_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          household_id?: string
          id?: string
          kind?: string
          maintenance_fee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_fee_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_fee_items_maintenance_fee_id_fkey"
            columns: ["maintenance_fee_id"]
            isOneToOne: false
            referencedRelation: "maintenance_fees"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_fees: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          due_date: string | null
          entry_mode: string
          household_id: string
          id: string
          memo: string | null
          status: string
          target_month: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          due_date?: string | null
          entry_mode?: string
          household_id: string
          id?: string
          memo?: string | null
          status?: string
          target_month: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          due_date?: string | null
          entry_mode?: string
          household_id?: string
          id?: string
          memo?: string | null
          status?: string
          target_month?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_fees_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_closings: {
        Row: {
          closed_at: string
          closed_by: string | null
          closed_month: string
          household_id: string
          id: string
          net_worth: number | null
          total_expense: number
          total_income: number
          total_savings: number
        }
        Insert: {
          closed_at?: string
          closed_by?: string | null
          closed_month: string
          household_id: string
          id?: string
          net_worth?: number | null
          total_expense?: number
          total_income?: number
          total_savings?: number
        }
        Update: {
          closed_at?: string
          closed_by?: string | null
          closed_month?: string
          household_id?: string
          id?: string
          net_worth?: number | null
          total_expense?: number
          total_income?: number
          total_savings?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_closings_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          household_id: string
          id: string
          is_read: boolean
          link: string | null
          read_at: string | null
          read_by: string | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          household_id: string
          id?: string
          is_read?: boolean
          link?: string | null
          read_at?: string | null
          read_by?: string | null
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          household_id?: string
          id?: string
          is_read?: boolean
          link?: string | null
          read_at?: string | null
          read_by?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_verifications: {
        Row: {
          attempt_count: number
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          max_attempts: number
          phone_e164: string
          status: string
          user_id: string | null
        }
        Insert: {
          attempt_count?: number
          code_hash: string
          created_at?: string
          expires_at: string
          id?: string
          max_attempts?: number
          phone_e164: string
          status?: string
          user_id?: string | null
        }
        Update: {
          attempt_count?: number
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          max_attempts?: number
          phone_e164?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pricing_plans: {
        Row: {
          ai_monthly_limit: number
          code: string
          created_at: string
          description: string
          is_active: boolean
          member_limit: number
          name: string
          price_krw_monthly: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          ai_monthly_limit?: number
          code: string
          created_at?: string
          description: string
          is_active?: boolean
          member_limit?: number
          name: string
          price_krw_monthly?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          ai_monthly_limit?: number
          code?: string
          created_at?: string
          description?: string
          is_active?: boolean
          member_limit?: number
          name?: string
          price_krw_monthly?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          amount: number
          auto_create: boolean
          category_id: string | null
          created_at: string
          created_by: string
          day_of_month: number | null
          deleted_at: string | null
          end_date: string | null
          frequency: string
          household_id: string
          id: string
          memo: string | null
          start_date: string
          status: string
          template_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          auto_create?: boolean
          category_id?: string | null
          created_at?: string
          created_by: string
          day_of_month?: number | null
          deleted_at?: string | null
          end_date?: string | null
          frequency?: string
          household_id: string
          id?: string
          memo?: string | null
          start_date: string
          status?: string
          template_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          auto_create?: boolean
          category_id?: string | null
          created_at?: string
          created_by?: string
          day_of_month?: number | null
          deleted_at?: string | null
          end_date?: string | null
          frequency?: string
          household_id?: string
          id?: string
          memo?: string | null
          start_date?: string
          status?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_accounts: {
        Row: {
          auto_debit_day: number | null
          created_at: string
          created_by: string
          current_balance: number
          deleted_at: string | null
          household_id: string
          id: string
          institution: string
          interest_rate: number | null
          maturity_date: string | null
          memo: string | null
          monthly_contribution: number
          owner_member_id: string | null
          product_name: string
          start_date: string
          status: string
          target_amount: number | null
          updated_at: string
          visibility: string
        }
        Insert: {
          auto_debit_day?: number | null
          created_at?: string
          created_by: string
          current_balance?: number
          deleted_at?: string | null
          household_id: string
          id?: string
          institution: string
          interest_rate?: number | null
          maturity_date?: string | null
          memo?: string | null
          monthly_contribution?: number
          owner_member_id?: string | null
          product_name: string
          start_date: string
          status?: string
          target_amount?: number | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          auto_debit_day?: number | null
          created_at?: string
          created_by?: string
          current_balance?: number
          deleted_at?: string | null
          household_id?: string
          id?: string
          institution?: string
          interest_rate?: number | null
          maturity_date?: string | null
          memo?: string | null
          monthly_contribution?: number
          owner_member_id?: string | null
          product_name?: string
          start_date?: string
          status?: string
          target_amount?: number | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_accounts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_accounts_owner_member_id_fkey"
            columns: ["owner_member_id"]
            isOneToOne: false
            referencedRelation: "household_members"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_attachments: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          household_id: string
          id: string
          mime_type: string
          original_filename: string
          storage_path: string
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          household_id: string
          id?: string
          mime_type: string
          original_filename: string
          storage_path: string
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          household_id?: string
          id?: string
          mime_type?: string
          original_filename?: string
          storage_path?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_attachments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_attachments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          actual_user_member_id: string | null
          actual_user_scope: string
          amount: number
          category_id: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          household_id: string
          id: string
          is_essential: boolean
          is_fixed: boolean
          memo: string | null
          occurred_at: string
          recurring_period: string | null
          recurring_transaction_id: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          actual_user_member_id?: string | null
          actual_user_scope?: string
          amount: number
          category_id?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          household_id: string
          id?: string
          is_essential?: boolean
          is_fixed?: boolean
          memo?: string | null
          occurred_at: string
          recurring_period?: string | null
          recurring_transaction_id?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          actual_user_member_id?: string | null
          actual_user_scope?: string
          amount?: number
          category_id?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          household_id?: string
          id?: string
          is_essential?: boolean
          is_fixed?: boolean
          memo?: string | null
          occurred_at?: string
          recurring_period?: string | null
          recurring_transaction_id?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_actual_user_member_id_fkey"
            columns: ["actual_user_member_id"]
            isOneToOne: false
            referencedRelation: "household_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recurring_fk"
            columns: ["recurring_transaction_id"]
            isOneToOne: false
            referencedRelation: "recurring_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          auth_provider: string
          created_at: string
          display_name: string
          email: string
          id: string
          is_platform_admin: boolean
          phone: string | null
          phone_verified_at: string | null
          updated_at: string
        }
        Insert: {
          auth_provider?: string
          created_at?: string
          display_name: string
          email: string
          id: string
          is_platform_admin?: boolean
          phone?: string | null
          phone_verified_at?: string | null
          updated_at?: string
        }
        Update: {
          auth_provider?: string
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          is_platform_admin?: boolean
          phone?: string | null
          phone_verified_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_income_scenario: {
        Args: { p_scenario_id: string }
        Returns: {
          created_at: string
          created_by: string
          deleted_at: string | null
          effective_from: string
          household_id: string
          id: string
          is_active: boolean
          kind: string
          memo: string | null
          name: string
          projected_monthly_income: number
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "income_scenarios"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      close_month: {
        Args: { p_household_id: string }
        Returns: {
          closed_at: string
          closed_by: string | null
          closed_month: string
          household_id: string
          id: string
          net_worth: number | null
          total_expense: number
          total_income: number
          total_savings: number
        }
        SetofOptions: {
          from: "*"
          to: "monthly_closings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_household: {
        Args: {
          p_display_name: string
          p_fiscal_start_day: number
          p_member_count: number
          p_name: string
          p_type: string
        }
        Returns: {
          created_at: string
          currency: string
          deleted_at: string | null
          fiscal_month_start_day: number
          id: string
          member_count: number
          name: string
          owner_user_id: string
          plan_code: string
          representative_member_id: string | null
          type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "households"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      deactivate_income_scenarios: {
        Args: { p_household_id: string }
        Returns: undefined
      }
      generate_due_recurring_transactions: {
        Args: { p_household_id: string }
        Returns: {
          actual_user_member_id: string | null
          actual_user_scope: string
          amount: number
          category_id: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          household_id: string
          id: string
          is_essential: boolean
          is_fixed: boolean
          memo: string | null
          occurred_at: string
          recurring_period: string | null
          recurring_transaction_id: string | null
          status: string
          type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_household_ai_config: {
        Args: { hh_id: string }
        Returns: {
          api_key: string
          model: string
          provider: string
        }[]
      }
      household_role: { Args: { hh_id: string }; Returns: string }
      is_household_member: { Args: { hh_id: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      join_household_with_code: {
        Args: { p_code: string; p_display_name: string }
        Returns: {
          display_name: string
          household_id: string
          id: string
          joined_at: string
          role: string
          status: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "household_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_asset_snapshot: {
        Args: { p_household_id: string }
        Returns: {
          cash_equivalent: number
          created_at: string
          created_by: string
          household_id: string
          id: string
          investment_assets: number
          net_worth: number
          real_assets: number
          snapshot_month: string
          total_assets: number
          total_liabilities: number
        }
        SetofOptions: {
          from: "*"
          to: "asset_snapshots"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      seed_default_categories: {
        Args: { p_created_by: string; p_household_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
