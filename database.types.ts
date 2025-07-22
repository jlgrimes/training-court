export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      feedback: {
        Row: {
          bug_type: string | null
          created_at: string | null
          description: string | null
          dev_notes: string | null
          feature_name: string
          id: number
          is_fixed: boolean | null
          user_id: string | null
        }
        Insert: {
          bug_type?: string | null
          created_at?: string | null
          description?: string | null
          dev_notes?: string | null
          feature_name: string
          id?: number
          is_fixed?: boolean | null
          user_id?: string | null
        }
        Update: {
          bug_type?: string | null
          created_at?: string | null
          description?: string | null
          dev_notes?: string | null
          feature_name?: string
          id?: number
          is_fixed?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user data"
            referencedColumns: ["id"]
          },
        ]
      }
      "friend requests": {
        Row: {
          created_at: string | null
          id: string
          user_sending: string | null
          uses_remaining: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_sending?: string | null
          uses_remaining?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user_sending?: string | null
          uses_remaining?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "friend requests_user_sending_fkey"
            columns: ["user_sending"]
            isOneToOne: false
            referencedRelation: "user data"
            referencedColumns: ["id"]
          },
        ]
      }
      friends: {
        Row: {
          created_at: string | null
          friend: string | null
          id: number
          user: string | null
        }
        Insert: {
          created_at?: string | null
          friend?: string | null
          id?: number
          user?: string | null
        }
        Update: {
          created_at?: string | null
          friend?: string | null
          id?: number
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friends_friend_fkey"
            columns: ["friend"]
            isOneToOne: false
            referencedRelation: "user data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "user data"
            referencedColumns: ["id"]
          },
        ]
      }
      logs: {
        Row: {
          archetype: string | null
          created_at: string | null
          format: string
          id: string
          log: string
          notes: string | null
          opp_archetype: string | null
          result: string | null
          turn_order: string | null
          user: string | null
        }
        Insert: {
          archetype?: string | null
          created_at?: string | null
          format?: string
          id?: string
          log: string
          notes?: string | null
          opp_archetype?: string | null
          result?: string | null
          turn_order?: string | null
          user?: string | null
        }
        Update: {
          archetype?: string | null
          created_at?: string | null
          format?: string
          id?: string
          log?: string
          notes?: string | null
          opp_archetype?: string | null
          result?: string | null
          turn_order?: string | null
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "user data"
            referencedColumns: ["id"]
          },
        ]
      }
      pocket_games: {
        Row: {
          created_at: string | null
          deck: string
          id: number
          opp_deck: string
          result: string
          user: string | null
        }
        Insert: {
          created_at?: string | null
          deck: string
          id?: number
          opp_deck: string
          result: string
          user?: string | null
        }
        Update: {
          created_at?: string | null
          deck?: string
          id?: number
          opp_deck?: string
          result?: string
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pocket_games_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "user data"
            referencedColumns: ["id"]
          },
        ]
      }
      "tournament rounds": {
        Row: {
          created_at: string | null
          deck: string | null
          id: string
          match_end_reason: string | null
          result: string[]
          round_num: number
          tournament: string | null
          turn_orders: string[] | null
          user: string | null
        }
        Insert: {
          created_at?: string | null
          deck?: string | null
          id?: string
          match_end_reason?: string | null
          result: string[]
          round_num: number
          tournament?: string | null
          turn_orders?: string[] | null
          user?: string | null
        }
        Update: {
          created_at?: string | null
          deck?: string | null
          id?: string
          match_end_reason?: string | null
          result?: string[]
          round_num?: number
          tournament?: string | null
          turn_orders?: string[] | null
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament rounds_tournament_fkey"
            columns: ["tournament"]
            isOneToOne: false
            referencedRelation: "tournament_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament rounds_tournament_fkey"
            columns: ["tournament"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament rounds_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "user data"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          category: string | null
          created_at: string | null
          date_from: string
          date_to: string
          deck: string | null
          format: string | null
          id: string
          name: string
          placement: string | null
          user: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          date_from: string
          date_to: string
          deck?: string | null
          format?: string | null
          id?: string
          name: string
          placement?: string | null
          user?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          date_from?: string
          date_to?: string
          deck?: string | null
          format?: string | null
          id?: string
          name?: string
          placement?: string | null
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "user data"
            referencedColumns: ["id"]
          },
        ]
      }
      "user data": {
        Row: {
          avatar: string | null
          created_at: string | null
          id: string
          is_premium_user: boolean | null
          live_screen_name: string | null
          screen_name: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          id?: string
          is_premium_user?: boolean | null
          live_screen_name?: string | null
          screen_name?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          id?: string
          is_premium_user?: boolean | null
          live_screen_name?: string | null
          screen_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      tournament_details: {
        Row: {
          category: string | null
          created_at: string | null
          date_from: string | null
          date_to: string | null
          deck: string | null
          format: string | null
          id: string | null
          losses: number | null
          name: string | null
          placement: string | null
          rounds: Json | null
          ties: number | null
          total_rounds: number | null
          user: string | null
          wins: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "user data"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      avatar_count: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar: string
          avatar_count: number
        }[]
      }
      get_user_tournament_and_battle_logs_v2: {
        Args: { user_id: string }
        Returns: {
          archetype: string
          opp_archetype: string
          result: string
          source: string
        }[]
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
