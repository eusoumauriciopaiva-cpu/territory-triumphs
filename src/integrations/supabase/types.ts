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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      challenges: {
        Row: {
          challenged_area: number
          challenged_id: string
          challenger_area: number
          challenger_id: string
          created_at: string
          expires_at: string
          id: string
          status: string
          winner_id: string | null
        }
        Insert: {
          challenged_area?: number
          challenged_id: string
          challenger_area?: number
          challenger_id: string
          created_at?: string
          expires_at?: string
          id?: string
          status?: string
          winner_id?: string | null
        }
        Update: {
          challenged_area?: number
          challenged_id?: string
          challenger_area?: number
          challenger_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          status?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "conquest_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      conquest_posts: {
        Row: {
          conquest_id: string
          created_at: string
          description: string | null
          id: string
          map_snapshot_url: string | null
          photo_urls: string[] | null
          title: string
          user_id: string
        }
        Insert: {
          conquest_id: string
          created_at?: string
          description?: string | null
          id?: string
          map_snapshot_url?: string | null
          photo_urls?: string[] | null
          title?: string
          user_id: string
        }
        Update: {
          conquest_id?: string
          created_at?: string
          description?: string | null
          id?: string
          map_snapshot_url?: string | null
          photo_urls?: string[] | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conquest_posts_conquest_id_fkey"
            columns: ["conquest_id"]
            isOneToOne: false
            referencedRelation: "conquests"
            referencedColumns: ["id"]
          },
        ]
      }
      conquests: {
        Row: {
          area: number
          center_latitude: number | null
          center_longitude: number | null
          created_at: string
          distance: number
          duration: number | null
          id: string
          path: Json
          user_id: string
        }
        Insert: {
          area: number
          center_latitude?: number | null
          center_longitude?: number | null
          created_at?: string
          distance: number
          duration?: number | null
          id?: string
          path: Json
          user_id: string
        }
        Update: {
          area?: number
          center_latitude?: number | null
          center_longitude?: number | null
          created_at?: string
          distance?: number
          duration?: number | null
          id?: string
          path?: Json
          user_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          id: string
          is_elite: boolean
          monthly_km: number
          name: string
          total_area: number
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_elite?: boolean
          monthly_km?: number
          name: string
          total_area?: number
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_elite?: boolean
          monthly_km?: number
          name?: string
          total_area?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          post_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          post_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          post_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "conquest_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          best_streak: number
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          last_latitude: number | null
          last_longitude: number | null
          level: number
          name: string
          nickname: string | null
          rank: Database["public"]["Enums"]["app_rank"]
          total_area: number
          total_km: number
          trail_color: string
          unique_code: string
          unlocked_colors: string[]
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          best_streak?: number
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          last_latitude?: number | null
          last_longitude?: number | null
          level?: number
          name?: string
          nickname?: string | null
          rank?: Database["public"]["Enums"]["app_rank"]
          total_area?: number
          total_km?: number
          trail_color?: string
          unique_code?: string
          unlocked_colors?: string[]
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          best_streak?: number
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          last_latitude?: number | null
          last_longitude?: number | null
          level?: number
          name?: string
          nickname?: string | null
          rank?: Database["public"]["Enums"]["app_rank"]
          total_area?: number
          total_km?: number
          trail_color?: string
          unique_code?: string
          unlocked_colors?: string[]
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "conquest_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      territory_conflicts: {
        Row: {
          area_invaded: number
          conquest_id: string
          created_at: string
          id: string
          invader_id: string
          is_read_by_admin: boolean
          is_read_by_victim: boolean
          latitude: number | null
          location_name: string | null
          longitude: number | null
          victim_id: string
        }
        Insert: {
          area_invaded?: number
          conquest_id: string
          created_at?: string
          id?: string
          invader_id: string
          is_read_by_admin?: boolean
          is_read_by_victim?: boolean
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          victim_id: string
        }
        Update: {
          area_invaded?: number
          conquest_id?: string
          created_at?: string
          id?: string
          invader_id?: string
          is_read_by_admin?: boolean
          is_read_by_victim?: boolean
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          victim_id?: string
        }
        Relationships: []
      }
      user_missions_daily: {
        Row: {
          collected: boolean
          created_at: string
          id: string
          mission_date: string
          mission_type: string
          progress: number
          target: number
          updated_at: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          collected?: boolean
          created_at?: string
          id?: string
          mission_date?: string
          mission_type: string
          progress?: number
          target: number
          updated_at?: string
          user_id: string
          xp_reward: number
        }
        Update: {
          collected?: boolean
          created_at?: string
          id?: string
          mission_date?: string
          mission_type?: string
          progress?: number
          target?: number
          updated_at?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["dev_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["dev_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["dev_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_rank: {
        Args: { xp_value: number }
        Returns: Database["public"]["Enums"]["app_rank"]
      }
      generate_unique_code: { Args: never; Returns: string }
      get_all_conflicts_admin: {
        Args: never
        Returns: {
          area_invaded: number
          conquest_id: string
          created_at: string
          id: string
          invader_id: string
          invader_name: string
          invader_nickname: string
          is_read_by_admin: boolean
          is_read_by_victim: boolean
          latitude: number
          location_name: string
          longitude: number
          victim_id: string
          victim_name: string
          victim_nickname: string
        }[]
      }
      get_all_conquests_admin: {
        Args: never
        Returns: {
          area: number
          created_at: string
          distance: number
          duration: number
          id: string
          path: Json
          profile_name: string
          profile_nickname: string
          trail_color: string
          user_id: string
        }[]
      }
      get_all_profiles_admin: {
        Args: never
        Returns: {
          avatar_url: string
          best_streak: number
          created_at: string
          current_streak: number
          email: string
          id: string
          level: number
          name: string
          nickname: string
          rank: Database["public"]["Enums"]["app_rank"]
          total_area: number
          total_km: number
          unique_code: string
          user_id: string
          xp: number
        }[]
      }
      has_dev_role: {
        Args: {
          _role: Database["public"]["Enums"]["dev_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_developer: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      admin_role: "user" | "admin"
      app_rank:
        | "bronze"
        | "silver"
        | "gold"
        | "platinum"
        | "diamond"
        | "master"
        | "grandmaster"
        | "emperor"
      dev_role: "admin" | "developer" | "user"
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
      admin_role: ["user", "admin"],
      app_rank: [
        "bronze",
        "silver",
        "gold",
        "platinum",
        "diamond",
        "master",
        "grandmaster",
        "emperor",
      ],
      dev_role: ["admin", "developer", "user"],
    },
  },
} as const
