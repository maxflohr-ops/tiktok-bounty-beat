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
      bounties: {
        Row: {
          artist_song: string | null
          contract_no: number
          cover_url: string | null
          created_at: string
          created_by: string | null
          currency: string
          deadline: string | null
          description: string
          funded_cash_cents: number
          id: string
          max_submissions: number | null
          payout_type: Database["public"]["Enums"]["payout_type"]
          platform_target: Database["public"]["Enums"]["platform_target"]
          reward_cash_cents: number
          reward_points: number
          sound_name: string
          source_assets_url: string | null
          status: Database["public"]["Enums"]["bounty_status"]
          stripe_customer_id: string | null
          tiktok_sound_url: string | null
          title: string
          top_up_session_id: string | null
          updated_at: string
        }
        Insert: {
          artist_song?: string | null
          contract_no?: number
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deadline?: string | null
          description: string
          funded_cash_cents?: number
          id?: string
          max_submissions?: number | null
          payout_type?: Database["public"]["Enums"]["payout_type"]
          platform_target?: Database["public"]["Enums"]["platform_target"]
          reward_cash_cents?: number
          reward_points?: number
          sound_name: string
          source_assets_url?: string | null
          status?: Database["public"]["Enums"]["bounty_status"]
          stripe_customer_id?: string | null
          tiktok_sound_url?: string | null
          title: string
          top_up_session_id?: string | null
          updated_at?: string
        }
        Update: {
          artist_song?: string | null
          contract_no?: number
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deadline?: string | null
          description?: string
          funded_cash_cents?: number
          id?: string
          max_submissions?: number | null
          payout_type?: Database["public"]["Enums"]["payout_type"]
          platform_target?: Database["public"]["Enums"]["platform_target"]
          reward_cash_cents?: number
          reward_points?: number
          sound_name?: string
          source_assets_url?: string | null
          status?: Database["public"]["Enums"]["bounty_status"]
          stripe_customer_id?: string | null
          tiktok_sound_url?: string | null
          title?: string
          top_up_session_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bounty_payments: {
        Row: {
          amount_cents: number
          bounty_id: string
          created_at: string
          created_by: string | null
          currency: string
          id: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          bounty_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          bounty_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bounty_payments_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "bounties"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_approvals: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          error: string | null
          id: string
          requested_by: string
          status: Database["public"]["Enums"]["payout_approval_status"]
          stripe_transfer_id: string | null
          submission_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          error?: string | null
          id?: string
          requested_by: string
          status?: Database["public"]["Enums"]["payout_approval_status"]
          stripe_transfer_id?: string | null
          submission_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          error?: string | null
          id?: string
          requested_by?: string
          status?: Database["public"]["Enums"]["payout_approval_status"]
          stripe_transfer_id?: string | null
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_approvals_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_methods: {
        Row: {
          created_at: string
          default_method: string
          id: string
          paypal_email: string | null
          stripe_connect_account_id: string | null
          stripe_connect_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_method?: string
          id?: string
          paypal_email?: string | null
          stripe_connect_account_id?: string | null
          stripe_connect_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_method?: string
          id?: string
          paypal_email?: string | null
          stripe_connect_account_id?: string | null
          stripe_connect_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          points: number
          tiktok_handle: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          points?: number
          tiktok_handle?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          points?: number
          tiktok_handle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          auto_check_notes: string | null
          auto_check_passed: boolean
          awarded_cash_cents: number
          awarded_points: number
          bounty_id: string
          claimed_at: string
          created_at: string
          editor_id: string
          id: string
          oembed_author: string | null
          oembed_thumbnail: string | null
          oembed_title: string | null
          paid_at: string | null
          paid_cash_cents: number
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["submission_status"]
          stripe_transfer_id: string | null
          submitted_at: string | null
          tiktok_handle: string
          tiktok_video_url: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          auto_check_notes?: string | null
          auto_check_passed?: boolean
          awarded_cash_cents?: number
          awarded_points?: number
          bounty_id: string
          claimed_at?: string
          created_at?: string
          editor_id: string
          id?: string
          oembed_author?: string | null
          oembed_thumbnail?: string | null
          oembed_title?: string | null
          paid_at?: string | null
          paid_cash_cents?: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          stripe_transfer_id?: string | null
          submitted_at?: string | null
          tiktok_handle: string
          tiktok_video_url?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          auto_check_notes?: string | null
          auto_check_passed?: boolean
          awarded_cash_cents?: number
          awarded_points?: number
          bounty_id?: string
          claimed_at?: string
          created_at?: string
          editor_id?: string
          id?: string
          oembed_author?: string | null
          oembed_thumbnail?: string | null
          oembed_title?: string | null
          paid_at?: string | null
          paid_cash_cents?: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          stripe_transfer_id?: string | null
          submitted_at?: string | null
          tiktok_handle?: string
          tiktok_video_url?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "submissions_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "bounties"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "editor"
      bounty_status:
        | "draft"
        | "active"
        | "closed"
        | "claimed"
        | "in_review"
        | "fulfilled"
        | "expired"
      payout_approval_status:
        | "pending"
        | "approved"
        | "rejected"
        | "sent"
        | "failed"
      payout_type: "flat" | "per_1k_views"
      platform_target: "tiktok" | "reels" | "shorts"
      submission_status:
        | "pending"
        | "approved"
        | "rejected"
        | "claimed"
        | "submitted"
        | "paid"
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
      app_role: ["admin", "manager", "editor"],
      bounty_status: [
        "draft",
        "active",
        "closed",
        "claimed",
        "in_review",
        "fulfilled",
        "expired",
      ],
      payout_approval_status: [
        "pending",
        "approved",
        "rejected",
        "sent",
        "failed",
      ],
      payout_type: ["flat", "per_1k_views"],
      platform_target: ["tiktok", "reels", "shorts"],
      submission_status: [
        "pending",
        "approved",
        "rejected",
        "claimed",
        "submitted",
        "paid",
      ],
    },
  },
} as const
