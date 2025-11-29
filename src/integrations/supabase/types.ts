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
      bookings: {
        Row: {
          consultation_type: string
          created_at: string
          crop_type: string | null
          district: string
          email: string | null
          farm_size: string
          id: string
          message: string
          name: string
          phone: string
          preferred_date: string
          preferred_time: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          consultation_type: string
          created_at?: string
          crop_type?: string | null
          district: string
          email?: string | null
          farm_size: string
          id?: string
          message: string
          name: string
          phone: string
          preferred_date: string
          preferred_time: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          consultation_type?: string
          created_at?: string
          crop_type?: string | null
          district?: string
          email?: string | null
          farm_size?: string
          id?: string
          message?: string
          name?: string
          phone?: string
          preferred_date?: string
          preferred_time?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      field_analyses: {
        Row: {
          analysis_date: string
          classification: Json
          classification_map_url: string
          created_at: string
          crop_recommendations: Json
          field_id: string
          id: string
          ndvi_stats: Json | null
          profitability_score: number
          user_id: string
        }
        Insert: {
          analysis_date: string
          classification: Json
          classification_map_url: string
          created_at?: string
          crop_recommendations: Json
          field_id: string
          id?: string
          ndvi_stats?: Json | null
          profitability_score: number
          user_id: string
        }
        Update: {
          analysis_date?: string
          classification?: Json
          classification_map_url?: string
          created_at?: string
          crop_recommendations?: Json
          field_id?: string
          id?: string
          ndvi_stats?: Json | null
          profitability_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_analyses_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          }
        ]
      }
      fields: {
        Row: {
          area: number
          area_unit: string
          coordinates: string | null
          created_at: string
          crop_type: string
          district: string
          expected_harvest_date: string | null
          id: string
          location: string
          name: string
          notes: string | null
          planting_date: string
          soil_type: string
          state: string
          updated_at: string
          user_id: string
          water_source: string
        }
        Insert: {
          area: number
          area_unit?: string
          coordinates?: string | null
          created_at?: string
          crop_type: string
          district: string
          expected_harvest_date?: string | null
          id?: string
          location: string
          name: string
          notes?: string | null
          planting_date: string
          soil_type: string
          state: string
          updated_at?: string
          user_id: string
          water_source: string
        }
        Update: {
          area?: number
          area_unit?: string
          coordinates?: string | null
          created_at?: string
          crop_type?: string
          district?: string
          expected_harvest_date?: string | null
          id?: string
          location?: string
          name?: string
          notes?: string | null
          planting_date?: string
          soil_type?: string
          state?: string
          updated_at?: string
          user_id?: string
          water_source?: string
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
