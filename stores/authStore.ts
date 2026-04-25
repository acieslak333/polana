import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import type { Database } from '@/services/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isOnboardingComplete: boolean;

  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isOnboardingComplete: false,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
    }),

  setProfile: (profile) =>
    set({
      profile,
      isOnboardingComplete: profile?.onboarding_completed ?? false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () =>
    set({
      session: null,
      user: null,
      profile: null,
      isLoading: false,
      isOnboardingComplete: false,
    }),
}));
