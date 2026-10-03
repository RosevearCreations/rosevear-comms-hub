// Generated during QL-008A from Supabase project gxujcwpktaickcgzyvnu.
// Regenerate after database migrations.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      ai_draft_replies: {
        Row: {
          approved: boolean;
          approved_at: string | null;
          confidence: number | null;
          conversation_id: string;
          created_at: string;
          draft_body: string;
          id: string;
          missing_info: string[];
          sent: boolean;
          sent_at: string | null;
        };
        Insert: {
          approved?: boolean;
          approved_at?: string | null;
          confidence?: number | null;
          conversation_id: string;
          created_at?: string;
          draft_body: string;
          id?: string;
          missing_info?: string[];
          sent?: boolean;
          sent_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['ai_draft_replies']['Insert']>;
        Relationships: [{ foreignKeyName: 'ai_draft_replies_conversation_id_fkey'; columns: ['conversation_id']; isOneToOne: false; referencedRelation: 'conversations'; referencedColumns: ['id'] }];
      };
      audit_events: {
        Row: {
          actor_id: string | null;
          brand: string | null;
          created_at: string;
          details: string | null;
          entity_id: string | null;
          entity_type: string;
          event_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          actor_id?: string | null;
          brand?: string | null;
          created_at?: string;
          details?: string | null;
          entity_id?: string | null;
          entity_type: string;
          event_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: Partial<Database['public']['Tables']['audit_events']['Insert']>;
        Relationships: [{ foreignKeyName: 'audit_events_brand_fkey'; columns: ['brand']; isOneToOne: false; referencedRelation: 'brands'; referencedColumns: ['id'] }];
      };
      brands: {
        Row: {
          business_type: string;
          created_at: string;
          display_name: string;
          id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          business_type: string;
          created_at?: string;
          display_name: string;
          id: string;
          status?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['brands']['Insert']>;
        Relationships: [];
      };
      consent_logs: {
        Row: {
          brand: string | null;
          consent_source: string;
          consent_text: string | null;
          consent_type: string;
          consented_at: string | null;
          contact_id: string | null;
          created_at: string;
          id: string;
          revoked_at: string | null;
        };
        Insert: {
          brand?: string | null;
          consent_source: string;
          consent_text?: string | null;
          consent_type: string;
          consented_at?: string | null;
          contact_id?: string | null;
          created_at?: string;
          id?: string;
          revoked_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['consent_logs']['Insert']>;
        Relationships: [
          { foreignKeyName: 'consent_logs_brand_fkey'; columns: ['brand']; isOneToOne: false; referencedRelation: 'brands'; referencedColumns: ['id'] },
          { foreignKeyName: 'consent_logs_contact_id_fkey'; columns: ['contact_id']; isOneToOne: false; referencedRelation: 'contacts'; referencedColumns: ['id'] }
        ];
      };
      contact_brand_profiles: {
        Row: {
          brand: string;
          contact_id: string;
          created_at: string;
          id: string;
          last_contacted_at: string | null;
          lead_quality: string;
          notes: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          brand: string;
          contact_id: string;
          created_at?: string;
          id?: string;
          last_contacted_at?: string | null;
          lead_quality?: string;
          notes?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['contact_brand_profiles']['Insert']>;
        Relationships: [
          { foreignKeyName: 'contact_brand_profiles_brand_fkey'; columns: ['brand']; isOneToOne: false; referencedRelation: 'brands'; referencedColumns: ['id'] },
          { foreignKeyName: 'contact_brand_profiles_contact_id_fkey'; columns: ['contact_id']; isOneToOne: false; referencedRelation: 'contacts'; referencedColumns: ['id'] }
        ];
      };
      contacts: {
        Row: {
          created_at: string;
          customer_type: string;
          email: string | null;
          id: string;
          name: string;
          notes: string | null;
          phone: string | null;
          primary_brand: string | null;
          source: string;
          town: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          customer_type?: string;
          email?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          primary_brand?: string | null;
          source?: string;
          town?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>;
        Relationships: [{ foreignKeyName: 'contacts_primary_brand_fkey'; columns: ['primary_brand']; isOneToOne: false; referencedRelation: 'brands'; referencedColumns: ['id'] }];
      };
      conversation_tags: {
        Row: { conversation_id: string; created_at: string; id: string; tag: string };
        Insert: { conversation_id: string; created_at?: string; id?: string; tag: string };
        Update: Partial<Database['public']['Tables']['conversation_tags']['Insert']>;
        Relationships: [{ foreignKeyName: 'conversation_tags_conversation_id_fkey'; columns: ['conversation_id']; isOneToOne: false; referencedRelation: 'conversations'; referencedColumns: ['id'] }];
      };
      conversations: {
        Row: {
          assigned_to: string | null;
          brand: string;
          contact_id: string | null;
          created_at: string;
          id: string;
          last_activity_at: string;
          priority: string;
          source_channel: string;
          status: string;
          subject: string | null;
          summary: string | null;
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          brand: string;
          contact_id?: string | null;
          created_at?: string;
          id?: string;
          last_activity_at?: string;
          priority?: string;
          source_channel: string;
          status?: string;
          subject?: string | null;
          summary?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
        Relationships: [
          { foreignKeyName: 'conversations_brand_fkey'; columns: ['brand']; isOneToOne: false; referencedRelation: 'brands'; referencedColumns: ['id'] },
          { foreignKeyName: 'conversations_contact_id_fkey'; columns: ['contact_id']; isOneToOne: false; referencedRelation: 'contacts'; referencedColumns: ['id'] }
        ];
      };
      follow_up_tasks: {
        Row: {
          brand: string;
          contact_id: string | null;
          conversation_id: string | null;
          created_at: string;
          due_at: string | null;
          id: string;
          notes: string | null;
          priority: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          brand: string;
          contact_id?: string | null;
          conversation_id?: string | null;
          created_at?: string;
          due_at?: string | null;
          id?: string;
          notes?: string | null;
          priority?: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['follow_up_tasks']['Insert']>;
        Relationships: [
          { foreignKeyName: 'follow_up_tasks_brand_fkey'; columns: ['brand']; isOneToOne: false; referencedRelation: 'brands'; referencedColumns: ['id'] },
          { foreignKeyName: 'follow_up_tasks_contact_id_fkey'; columns: ['contact_id']; isOneToOne: false; referencedRelation: 'contacts'; referencedColumns: ['id'] },
          { foreignKeyName: 'follow_up_tasks_conversation_id_fkey'; columns: ['conversation_id']; isOneToOne: false; referencedRelation: 'conversations'; referencedColumns: ['id'] }
        ];
      };
      intake_requests: {
        Row: {
          brand: string;
          contact_id: string | null;
          conversation_id: string | null;
          created_at: string;
          estimated_price_max: number | null;
          estimated_price_min: number | null;
          flags: string[];
          id: string;
          intake_type: string;
          raw_answers: Json;
          recommended_service: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          brand: string;
          contact_id?: string | null;
          conversation_id?: string | null;
          created_at?: string;
          estimated_price_max?: number | null;
          estimated_price_min?: number | null;
          flags?: string[];
          id?: string;
          intake_type: string;
          raw_answers?: Json;
          recommended_service?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['intake_requests']['Insert']>;
        Relationships: [
          { foreignKeyName: 'intake_requests_brand_fkey'; columns: ['brand']; isOneToOne: false; referencedRelation: 'brands'; referencedColumns: ['id'] },
          { foreignKeyName: 'intake_requests_contact_id_fkey'; columns: ['contact_id']; isOneToOne: false; referencedRelation: 'contacts'; referencedColumns: ['id'] },
          { foreignKeyName: 'intake_requests_conversation_id_fkey'; columns: ['conversation_id']; isOneToOne: false; referencedRelation: 'conversations'; referencedColumns: ['id'] }
        ];
      };
      messages: {
        Row: {
          ai_generated: boolean;
          approved_by: string | null;
          attachments: Json;
          body: string;
          channel: string;
          conversation_id: string;
          created_at: string;
          direction: string;
          human_approved: boolean;
          id: string;
        };
        Insert: {
          ai_generated?: boolean;
          approved_by?: string | null;
          attachments?: Json;
          body: string;
          channel: string;
          conversation_id: string;
          created_at?: string;
          direction: string;
          human_approved?: boolean;
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
        Relationships: [{ foreignKeyName: 'messages_conversation_id_fkey'; columns: ['conversation_id']; isOneToOne: false; referencedRelation: 'conversations'; referencedColumns: ['id'] }];
      };
      phone_calls: {
        Row: {
          ai_summary: string | null;
          ai_tags: string[];
          brand: string;
          contact_id: string | null;
          conversation_id: string | null;
          created_at: string;
          direction: string;
          duration_seconds: number | null;
          ended_at: string | null;
          follow_up_required: boolean;
          from_number: string | null;
          id: string;
          provider_call_id: string | null;
          recording_url: string | null;
          started_at: string | null;
          status: string;
          to_number: string | null;
          transcript: string | null;
          voicemail_url: string | null;
        };
        Insert: {
          ai_summary?: string | null;
          ai_tags?: string[];
          brand: string;
          contact_id?: string | null;
          conversation_id?: string | null;
          created_at?: string;
          direction: string;
          duration_seconds?: number | null;
          ended_at?: string | null;
          follow_up_required?: boolean;
          from_number?: string | null;
          id?: string;
          provider_call_id?: string | null;
          recording_url?: string | null;
          started_at?: string | null;
          status?: string;
          to_number?: string | null;
          transcript?: string | null;
          voicemail_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['phone_calls']['Insert']>;
        Relationships: [
          { foreignKeyName: 'phone_calls_brand_fkey'; columns: ['brand']; isOneToOne: false; referencedRelation: 'brands'; referencedColumns: ['id'] },
          { foreignKeyName: 'phone_calls_contact_id_fkey'; columns: ['contact_id']; isOneToOne: false; referencedRelation: 'contacts'; referencedColumns: ['id'] },
          { foreignKeyName: 'phone_calls_conversation_id_fkey'; columns: ['conversation_id']; isOneToOne: false; referencedRelation: 'conversations'; referencedColumns: ['id'] }
        ];
      };
      phone_numbers: {
        Row: {
          active: boolean;
          brand: string;
          business_hours: Json;
          created_at: string;
          id: string;
          label: string | null;
          number: string;
          provider: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          brand: string;
          business_hours?: Json;
          created_at?: string;
          id?: string;
          label?: string | null;
          number: string;
          provider: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['phone_numbers']['Insert']>;
        Relationships: [{ foreignKeyName: 'phone_numbers_brand_fkey'; columns: ['brand']; isOneToOne: false; referencedRelation: 'brands'; referencedColumns: ['id'] }];
      };
      sms_messages: {
        Row: {
          ai_generated: boolean;
          body: string;
          brand: string;
          contact_id: string | null;
          conversation_id: string | null;
          created_at: string;
          direction: string;
          from_number: string | null;
          human_approved: boolean;
          id: string;
          media_urls: Json;
          provider_message_id: string | null;
          status: string;
          to_number: string | null;
        };
        Insert: {
          ai_generated?: boolean;
          body: string;
          brand: string;
          contact_id?: string | null;
          conversation_id?: string | null;
          created_at?: string;
          direction: string;
          from_number?: string | null;
          human_approved?: boolean;
          id?: string;
          media_urls?: Json;
          provider_message_id?: string | null;
          status?: string;
          to_number?: string | null;
        };
        Update: Partial<Database['public']['Tables']['sms_messages']['Insert']>;
        Relationships: [
          { foreignKeyName: 'sms_messages_brand_fkey'; columns: ['brand']; isOneToOne: false; referencedRelation: 'brands'; referencedColumns: ['id'] },
          { foreignKeyName: 'sms_messages_contact_id_fkey'; columns: ['contact_id']; isOneToOne: false; referencedRelation: 'contacts'; referencedColumns: ['id'] },
          { foreignKeyName: 'sms_messages_conversation_id_fkey'; columns: ['conversation_id']; isOneToOne: false; referencedRelation: 'conversations'; referencedColumns: ['id'] }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;
type DefaultSchema = DatabaseWithoutInternals['public'];

export type Tables<
  DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views']) | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends { Row: infer R }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends { Row: infer R }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends { Insert: infer I }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends { Insert: infer I }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends { Update: infer U }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends { Update: infer U }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
