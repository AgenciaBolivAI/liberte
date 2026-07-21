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
      activity_results: {
        Row: {
          aciertos: Json
          competence: string
          created_at: string
          day_id: number
          errores: Json
          expected: string
          feedback_alumno: string
          id: string
          item_index: number
          practica_recomendada: string
          prompt: string
          punto_debil: string
          response: string
          resultado: string
          score: number
          section: string
          user_id: string
        }
        Insert: {
          aciertos?: Json
          competence: string
          created_at?: string
          day_id: number
          errores?: Json
          expected?: string
          feedback_alumno?: string
          id?: string
          item_index?: number
          practica_recomendada?: string
          prompt?: string
          punto_debil?: string
          response?: string
          resultado?: string
          score?: number
          section: string
          user_id: string
        }
        Update: {
          aciertos?: Json
          competence?: string
          created_at?: string
          day_id?: number
          errores?: Json
          expected?: string
          feedback_alumno?: string
          id?: string
          item_index?: number
          practica_recomendada?: string
          prompt?: string
          punto_debil?: string
          response?: string
          resultado?: string
          score?: number
          section?: string
          user_id?: string
        }
        Relationships: []
      }
      authored_blocks: {
        Row: {
          day_id: number
          id: string
          payload: Json
          sort: number
          type: string
          updated_at: string
        }
        Insert: {
          day_id: number
          id?: string
          payload?: Json
          sort?: number
          type: string
          updated_at?: string
        }
        Update: {
          day_id?: number
          id?: string
          payload?: Json
          sort?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      authored_days: {
        Row: {
          created_by: string | null
          day_id: number
          status: string
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          created_by?: string | null
          day_id: number
          status?: string
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_by?: string | null
          day_id?: number
          status?: string
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string
          description: string | null
          duration_min: number
          id: string
          kind: string
          material_to: string | null
          reference_times: Json | null
          start_utc: string
          title: string
          updated_at: string
          zoom_id: string | null
          zoom_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          kind: string
          material_to?: string | null
          reference_times?: Json | null
          start_utc: string
          title: string
          updated_at?: string
          zoom_id?: string | null
          zoom_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          kind?: string
          material_to?: string | null
          reference_times?: Json | null
          start_utc?: string
          title?: string
          updated_at?: string
          zoom_id?: string | null
          zoom_url?: string | null
        }
        Relationships: []
      }
      content_access: {
        Row: {
          access: string
          id: string
          scope: string
          set_by: string | null
          target_id: number
          target_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access: string
          id?: string
          scope: string
          set_by?: string | null
          target_id: number
          target_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access?: string
          id?: string
          scope?: string
          set_by?: string | null
          target_id?: number
          target_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      day_completions: {
        Row: {
          completed_at: string
          day_id: number
          id: string
          user_id: string
          week_number: number
        }
        Insert: {
          completed_at?: string
          day_id: number
          id?: string
          user_id: string
          week_number?: number
        }
        Update: {
          completed_at?: string
          day_id?: number
          id?: string
          user_id?: string
          week_number?: number
        }
        Relationships: []
      }
      day_state: {
        Row: {
          current_lesson: string | null
          day_id: number
          done_lessons: Json
          stars: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_lesson?: string | null
          day_id: number
          done_lessons?: Json
          stars?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_lesson?: string | null
          day_id?: number
          done_lessons?: Json
          stars?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      defi_results: {
        Row: {
          celebration_message: string | null
          created_at: string
          day_id: number
          errors: Json
          hits: number
          id: string
          misses: number
          recommendation: string | null
          score_10: number
          stages: Json
          strengths: Json
          updated_at: string
          user_id: string
          weak_points: Json
        }
        Insert: {
          celebration_message?: string | null
          created_at?: string
          day_id: number
          errors?: Json
          hits?: number
          id?: string
          misses?: number
          recommendation?: string | null
          score_10?: number
          stages?: Json
          strengths?: Json
          updated_at?: string
          user_id: string
          weak_points?: Json
        }
        Update: {
          celebration_message?: string | null
          created_at?: string
          day_id?: number
          errors?: Json
          hits?: number
          id?: string
          misses?: number
          recommendation?: string | null
          score_10?: number
          stages?: Json
          strengths?: Json
          updated_at?: string
          user_id?: string
          weak_points?: Json
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          nationality: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          nationality?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          nationality?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_path: string | null
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_path?: string | null
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_path?: string | null
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          birth_date: string | null
          country_residence: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          mother_tongue: string | null
          nationality: string | null
          objective: string | null
          phone: string | null
          telegram_chat_id: string | null
          telegram_link_code: string | null
          telegram_linked_at: string | null
          telegram_username: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          country_residence?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          mother_tongue?: string | null
          nationality?: string | null
          objective?: string | null
          phone?: string | null
          telegram_chat_id?: string | null
          telegram_link_code?: string | null
          telegram_linked_at?: string | null
          telegram_username?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          country_residence?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          mother_tongue?: string | null
          nationality?: string | null
          objective?: string | null
          phone?: string | null
          telegram_chat_id?: string | null
          telegram_link_code?: string | null
          telegram_linked_at?: string | null
          telegram_username?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      telegram_reminders: {
        Row: {
          event_id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          sent_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recorded_classes: {
        Row: {
          created_at: string
          date_label: string
          id: string
          number: number
          sort: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          date_label?: string
          id?: string
          number?: number
          sort?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          date_label?: string
          id?: string
          number?: number
          sort?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      star_awards: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          source_key: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          reason: string
          source_key: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          source_key?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tutor_events: {
        Row: {
          corrected: string | null
          created_at: string
          day_id: number
          id: string
          kind: string
          rule_es: string | null
          said: string | null
          user_id: string
        }
        Insert: {
          corrected?: string | null
          created_at?: string
          day_id: number
          id?: string
          kind: string
          rule_es?: string | null
          said?: string | null
          user_id: string
        }
        Update: {
          corrected?: string | null
          created_at?: string
          day_id?: number
          id?: string
          kind?: string
          rule_es?: string | null
          said?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tutor_conversations: {
        Row: {
          day_id: number
          messages: Json
          objectives_done: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          day_id?: number
          messages?: Json
          objectives_done?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          day_id?: number
          messages?: Json
          objectives_done?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tutor_usage: {
        Row: {
          message_count: number
          updated_at: string
          usage_date: string
          user_id: string
        }
        Insert: {
          message_count?: number
          updated_at?: string
          usage_date: string
          user_id: string
        }
        Update: {
          message_count?: number
          updated_at?: string
          usage_date?: string
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
      week_state: {
        Row: {
          state: Json
          updated_at: string
          user_id: string
          week_number: number
        }
        Insert: {
          state?: Json
          updated_at?: string
          user_id: string
          week_number: number
        }
        Update: {
          state?: Json
          updated_at?: string
          user_id?: string
          week_number?: number
        }
        Relationships: []
      }
      week_unlocks: {
        Row: {
          unlocked_at: string
          unlocked_by: string | null
          user_id: string
          week_number: number
        }
        Insert: {
          unlocked_at?: string
          unlocked_by?: string | null
          user_id: string
          week_number: number
        }
        Update: {
          unlocked_at?: string
          unlocked_by?: string | null
          user_id?: string
          week_number?: number
        }
        Relationships: []
      }
      weekly_evaluations: {
        Row: {
          ai_report: Json
          created_at: string
          id: string
          pdf_generated: boolean
          pdf_generated_at: string | null
          responses: Json
          test_score: number
          test_scores: Json
          updated_at: string
          user_id: string
          week_number: number
          weekly_score: number
        }
        Insert: {
          ai_report?: Json
          created_at?: string
          id?: string
          pdf_generated?: boolean
          pdf_generated_at?: string | null
          responses?: Json
          test_score?: number
          test_scores?: Json
          updated_at?: string
          user_id: string
          week_number: number
          weekly_score?: number
        }
        Update: {
          ai_report?: Json
          created_at?: string
          id?: string
          pdf_generated?: boolean
          pdf_generated_at?: string | null
          responses?: Json
          test_score?: number
          test_scores?: Json
          updated_at?: string
          user_id?: string
          week_number?: number
          weekly_score?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_week_defi_summary: {
        Args: { _from_day: number; _to_day: number; _user_id: string }
        Returns: {
          avg_score: number
          days_completed: number
          errors: Json
          recommendations: Json
          strengths: Json
          total_hits: number
          total_misses: number
          weak_points: Json
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "student" | "coach" | "admin"
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
      app_role: ["student", "coach", "admin"],
    },
  },
} as const
