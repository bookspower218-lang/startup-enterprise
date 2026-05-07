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
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          pitch_id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          pitch_id: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          pitch_id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "pitches"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pitch_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          pitch_id: string
          size_bytes: number | null
          uploader_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          pitch_id: string
          size_bytes?: number | null
          uploader_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          pitch_id?: string
          size_bytes?: number | null
          uploader_id?: string
        }
        Relationships: []
      }
      pitch_meetings: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          pitch_id: string
          proposer_id: string
          scheduled_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          pitch_id: string
          proposer_id: string
          scheduled_at: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          pitch_id?: string
          proposer_id?: string
          scheduled_at?: string
        }
        Relationships: []
      }
      pitch_payments: {
        Row: {
          amount: number
          id: string
          payer_id: string
          pitch_id: string
          reference_note: string | null
          status: Database["public"]["Enums"]["pay_status"]
          submitted_at: string
          tier: Database["public"]["Enums"]["payment_tier"]
          verified_at: string | null
        }
        Insert: {
          amount: number
          id?: string
          payer_id: string
          pitch_id: string
          reference_note?: string | null
          status?: Database["public"]["Enums"]["pay_status"]
          submitted_at?: string
          tier: Database["public"]["Enums"]["payment_tier"]
          verified_at?: string | null
        }
        Update: {
          amount?: number
          id?: string
          payer_id?: string
          pitch_id?: string
          reference_note?: string | null
          status?: Database["public"]["Enums"]["pay_status"]
          submitted_at?: string
          tier?: Database["public"]["Enums"]["payment_tier"]
          verified_at?: string | null
        }
        Relationships: []
      }
      pitch_ratings: {
        Row: {
          comment: string | null
          communication: number
          created_at: string
          follow_through: number
          id: string
          pitch_id: string
          professionalism: number
          ratee_id: string
          rater_id: string
        }
        Insert: {
          comment?: string | null
          communication: number
          created_at?: string
          follow_through: number
          id?: string
          pitch_id: string
          professionalism: number
          ratee_id: string
          rater_id: string
        }
        Update: {
          comment?: string | null
          communication?: number
          created_at?: string
          follow_through?: number
          id?: string
          pitch_id?: string
          professionalism?: number
          ratee_id?: string
          rater_id?: string
        }
        Relationships: []
      }
      pitch_responses: {
        Row: {
          company_id: string
          created_at: string
          decision: Database["public"]["Enums"]["response_decision"]
          id: string
          message: string
          pitch_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          decision: Database["public"]["Enums"]["response_decision"]
          id?: string
          message: string
          pitch_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          decision?: Database["public"]["Enums"]["response_decision"]
          id?: string
          message?: string
          pitch_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pitch_responses_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "pitches"
            referencedColumns: ["id"]
          },
        ]
      }
      pitches: {
        Row: {
          asking_amount: number | null
          created_at: string
          description: string | null
          expires_at: string
          id: string
          industry: string
          pitch_type: Database["public"]["Enums"]["pitch_type"]
          problem: string | null
          short_note: string | null
          solution: string | null
          stage_3_unlocked: boolean
          stage_4_unlocked: boolean
          startup_id: string
          status: Database["public"]["Enums"]["pitch_status"]
          target_company_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          asking_amount?: number | null
          created_at?: string
          description?: string | null
          expires_at?: string
          id?: string
          industry: string
          pitch_type: Database["public"]["Enums"]["pitch_type"]
          problem?: string | null
          short_note?: string | null
          solution?: string | null
          stage_3_unlocked?: boolean
          stage_4_unlocked?: boolean
          startup_id: string
          status?: Database["public"]["Enums"]["pitch_status"]
          target_company_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          asking_amount?: number | null
          created_at?: string
          description?: string | null
          expires_at?: string
          id?: string
          industry?: string
          pitch_type?: Database["public"]["Enums"]["pitch_type"]
          problem?: string | null
          short_note?: string | null
          solution?: string | null
          stage_3_unlocked?: boolean
          stage_4_unlocked?: boolean
          startup_id?: string
          status?: Database["public"]["Enums"]["pitch_status"]
          target_company_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          bio: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          industry: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          plan: Database["public"]["Enums"]["plan_tier"] | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          bio?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          industry?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          plan?: Database["public"]["Enums"]["plan_tier"] | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          bio?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          industry?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          plan?: Database["public"]["Enums"]["plan_tier"] | null
          updated_at?: string
          user_id?: string
          website?: string | null
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
      monthly_pitch_count: { Args: { _uid: string }; Returns: number }
      plan_pitch_limit: { Args: { _uid: string }; Returns: number }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      user_avg_rating: { Args: { _uid: string }; Returns: number }
    }
    Enums: {
      account_type: "startup" | "company"
      app_role: "admin" | "startup" | "company"
      pay_status: "pending" | "verified" | "rejected"
      payment_status: "pending" | "verified" | "none"
      payment_tier: "stage_3" | "stage_4"
      pitch_status: "open" | "closed" | "expired"
      pitch_type: "sell" | "investment" | "networking"
      plan_tier: "basic" | "pro" | "elite"
      response_decision: "interested" | "declined" | "pass"
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
      account_type: ["startup", "company"],
      app_role: ["admin", "startup", "company"],
      pay_status: ["pending", "verified", "rejected"],
      payment_status: ["pending", "verified", "none"],
      payment_tier: ["stage_3", "stage_4"],
      pitch_status: ["open", "closed", "expired"],
      pitch_type: ["sell", "investment", "networking"],
      plan_tier: ["basic", "pro", "elite"],
      response_decision: ["interested", "declined", "pass"],
    },
  },
} as const
