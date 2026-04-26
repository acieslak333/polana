import { act, renderHook } from '@testing-library/react-native';
import { useAuthStore } from '../authStore';

const mockSession = {
  user: { id: 'user-1', email: 'test@example.com' },
  access_token: 'token-abc',
  refresh_token: 'refresh-abc',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Date.now() + 3600,
} as unknown as import('@supabase/supabase-js').Session;

const mockProfile = {
  id: 'user-1',
  first_name: 'Test',
  last_name: null,
  nickname: 'tester',
  date_of_birth: '1990-01-01',
  bio: null,
  city_id: 'city-1',
  avatar_config: {},
  custom_avatar_url: null,
  profile_color_scheme: 'default',
  interests: [],
  notifications_enabled: false,
  language: 'pl',
  onboarding_completed: true,
  created_at: '2026-01-01T00:00:00Z',
  last_active_at: '2026-01-01T00:00:00Z',
};

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state between tests
    const { result } = renderHook(() => useAuthStore());
    act(() => { result.current.reset(); });
  });

  it('starts with null session and loading=true', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => { result.current.reset(); }); // reset sets isLoading=false
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it('setSession sets session and user', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => { result.current.setSession(mockSession); });
    expect(result.current.session).toBe(mockSession);
    expect(result.current.user?.id).toBe('user-1');
  });

  it('setSession(null) clears user', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.setSession(mockSession);
      result.current.setSession(null);
    });
    expect(result.current.user).toBeNull();
  });

  it('setProfile sets profile and isOnboardingComplete=true', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => { result.current.setProfile(mockProfile); });
    expect(result.current.profile?.id).toBe('user-1');
    expect(result.current.isOnboardingComplete).toBe(true);
  });

  it('setProfile with onboarding_completed=false sets flag false', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => { result.current.setProfile({ ...mockProfile, onboarding_completed: false }); });
    expect(result.current.isOnboardingComplete).toBe(false);
  });

  it('reset() clears all state', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.setSession(mockSession);
      result.current.setProfile(mockProfile);
      result.current.reset();
    });
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.isOnboardingComplete).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('setLoading toggles isLoading', () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => { result.current.setLoading(true); });
    expect(result.current.isLoading).toBe(true);
    act(() => { result.current.setLoading(false); });
    expect(result.current.isLoading).toBe(false);
  });
});
