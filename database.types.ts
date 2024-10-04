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
      feedback: {
        Row: {
          bug_type: string | null
          created_at: string
          description: string | null
          dev_notes: string | null
          feature_name: string
          id: number
          is_fixed: boolean | null
          user_id: string
        }
        Insert: {
          bug_type?: string | null
          created_at?: string
          description?: string | null
          dev_notes?: string | null
          feature_name: string
          id?: number
          is_fixed?: boolean | null
          user_id?: string
        }
        Update: {
          bug_type?: string | null
          created_at?: string
          description?: string | null
          dev_notes?: string | null
          feature_name?: string
          id?: number
          is_fixed?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      "friend requests": {
        Row: {
          created_at: string
          id: string
          user_sending: string
          uses_remaining: number
        }
        Insert: {
          created_at?: string
          id?: string
          user_sending?: string
          uses_remaining?: number
        }
        Update: {
          created_at?: string
          id?: string
          user_sending?: string
          uses_remaining?: number
        }
        Relationships: [
          {
            foreignKeyName: "friend requests_user_sending_fkey"
            columns: ["user_sending"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend requests_user_sending_fkey1"
            columns: ["user_sending"]
            isOneToOne: false
            referencedRelation: "user data"
            referencedColumns: ["id"]
          },
        ]
      }
      friends: {
        Row: {
          created_at: string
          friend: string
          id: number
          user: string
        }
        Insert: {
          created_at?: string
          friend: string
          id?: number
          user: string
        }
        Update: {
          created_at?: string
          friend?: string
          id?: number
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "friends_friend_fkey"
            columns: ["friend"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_friend_fkey1"
            columns: ["friend"]
            isOneToOne: false
            referencedRelation: "user data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_user_fkey1"
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
          opp_archetype: string | null
          created_at: string
          id: string
          log: string
          notes: string | null
          user: string
        }
        Insert: {
          archetype?: string | null
          created_at?: string
          id?: string
          log: string
          notes?: string | null
          user: string
        }
        Update: {
          archetype?: string | null
          created_at?: string
          id?: string
          log?: string
          notes?: string | null
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "logs_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      "tournament rounds": {
        Row: {
          created_at: string
          deck: string | null
          id: string
          match_end_reason: string | null
          result: string[]
          round_num: number
          tournament: string
          user: string
          went_first: boolean | null
        }
        Insert: {
          created_at?: string
          deck?: string | null
          id?: string
          match_end_reason?: string | null
          result: string[]
          round_num: number
          tournament: string
          user: string
          went_first?: boolean | null
        }
        Update: {
          created_at?: string
          deck?: string | null
          id?: string
          match_end_reason?: string | null
          result?: string[]
          round_num?: number
          tournament?: string
          user?: string
          went_first?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament rounds_tournament_fkey"
            columns: ["tournament"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          category: string | null
          created_at: string
          date_from: string
          date_to: string
          deck: string | null
          id: string
          name: string
          placement: string | null
          user: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          date_from: string
          date_to: string
          deck?: string | null
          id?: string
          name: string
          placement?: string | null
          user: string
        }
        Update: {
          category?: string | null
          created_at?: string
          date_from?: string
          date_to?: string
          deck?: string | null
          id?: string
          name?: string
          placement?: string | null
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      "user data": {
        Row: {
          avatar: string | null
          created_at: string
          id: string
          live_screen_name: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          id: string
          live_screen_name?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string
          id?: string
          live_screen_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user data_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      pilot_users: {
        Row: {
          user: string | null
        }
        Relationships: []
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
      getusertournamentresults: {
        Args: {
          userid: string
        }
        Returns: {
          tournament_deck: string
          round_deck: string
          total_wins: number
          total_losses: number
          total_ties: number
          total_matches: number
          win_rate: number
          tie_rate: number
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
