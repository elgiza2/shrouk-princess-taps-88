export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cards: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          hourly_yield: number | null
          id: string
          name: string
          price: number | null
          rarity: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          hourly_yield?: number | null
          id?: string
          name: string
          price?: number | null
          rarity?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          hourly_yield?: number | null
          id?: string
          name?: string
          price?: number | null
          rarity?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category: string | null
          completed: boolean | null
          created_at: string | null
          description: string | null
          id: string
          link: string | null
          reward: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          link?: string | null
          reward?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          link?: string | null
          reward?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          from_address: string | null
          id: string
          status: string
          to_address: string | null
          transaction_hash: string | null
          transaction_type: string
          updated_at: string
          user_address: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          from_address?: string | null
          id?: string
          status?: string
          to_address?: string | null
          transaction_hash?: string | null
          transaction_type: string
          updated_at?: string
          user_address: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          from_address?: string | null
          id?: string
          status?: string
          to_address?: string | null
          transaction_hash?: string | null
          transaction_type?: string
          updated_at?: string
          user_address?: string
        }
        Relationships: []
      }
      user_balances: {
        Row: {
          id: string
          last_updated: string
          shrouk_balance: number
          ton_balance: number
          user_address: string
        }
        Insert: {
          id?: string
          last_updated?: string
          shrouk_balance?: number
          ton_balance?: number
          user_address: string
        }
        Update: {
          id?: string
          last_updated?: string
          shrouk_balance?: number
          ton_balance?: number
          user_address?: string
        }
        Relationships: []
      }
      user_tap_points: {
        Row: {
          created_at: string | null
          last_tap_at: string | null
          max_taps: number
          tap_points: number
          tap_upgrade_level: number
          tap_value: number
          updated_at: string | null
          user_address: string
        }
        Insert: {
          created_at?: string | null
          last_tap_at?: string | null
          max_taps?: number
          tap_points?: number
          tap_upgrade_level?: number
          tap_value?: number
          updated_at?: string | null
          user_address: string
        }
        Update: {
          created_at?: string | null
          last_tap_at?: string | null
          max_taps?: number
          tap_points?: number
          tap_upgrade_level?: number
          tap_value?: number
          updated_at?: string | null
          user_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
