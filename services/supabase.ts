import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/constants/config';

// Supabase requires an AsyncStorage-compatible adapter.
// We use SecureStore so tokens are encrypted on-device — never plain AsyncStorage.
const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string | null;
          nickname: string | null;
          date_of_birth: string;
          bio: string | null;
          city_id: string | null;
          avatar_config: Record<string, unknown>;
          custom_avatar_url: string | null;
          profile_color_scheme: string;
          interests: string[];
          notifications_enabled: boolean;
          language: string;
          onboarding_completed: boolean;
          created_at: string;
          last_active_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'last_active_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      gromady: {
        Row: {
          id: string;
          name: string;
          avatar_config: Record<string, unknown>;
          city_id: string;
          size_type: 'small' | 'medium' | 'large';
          max_members: number;
          elder_id: string | null;
          member_count: number;
          description: string | null;
          last_activity_at: string;
          status: 'active' | 'dormant' | 'archived';
          total_meetings_count: number;
          meetings_this_month: number;
          meetings_this_week: number;
          favors_exchanged: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['gromady']['Row'], 'created_at' | 'last_activity_at' | 'member_count' | 'total_meetings_count' | 'meetings_this_month' | 'meetings_this_week' | 'favors_exchanged'>;
        Update: Partial<Database['public']['Tables']['gromady']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          gromada_id: string | null;
          created_by: string;
          title: string;
          description: string | null;
          location_name: string;
          location_point: unknown | null;
          city_id: string | null;
          starts_at: string;
          ends_at: string | null;
          max_attendees: number | null;
          is_public: boolean;
          is_auto_generated: boolean;
          event_type: string;
          status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          chat_room_id: string;
          sender_id: string;
          body: string;
          media_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
      cities: {
        Row: {
          id: string;
          name: string;
          country_code: string;
          timezone: string;
          is_active: boolean;
          created_at: string;
        };
      };
      interests: {
        Row: {
          id: string;
          name_pl: string;
          name_en: string;
          emoji: string;
          category: string | null;
          is_default: boolean;
        };
      };
    };
  };
};
