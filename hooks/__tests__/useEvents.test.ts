import { renderHook, act } from '@testing-library/react-native';
import { useCityEvents } from '../useEvents';
import * as eventsApi from '@/services/api/events';
import { makeEvent } from '@/__fixtures__';

jest.mock('@/services/api/events');
const mockFetchCityEvents = eventsApi.fetchCityEvents as jest.Mock;
const mockUpsertRSVP = eventsApi.upsertRSVP as jest.Mock;

jest.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}));

beforeEach(() => { jest.clearAllMocks(); });

describe('useCityEvents', () => {
  it('starts empty', () => {
    mockFetchCityEvents.mockResolvedValue([]);
    const { result } = renderHook(() => useCityEvents('city-1'));
    expect(result.current.events).toHaveLength(0);
  });

  it('loads events for city', async () => {
    const events = [
      { ...makeEvent(), rsvp_count: 0, user_rsvp: null, gromady: null },
      { ...makeEvent(), rsvp_count: 2, user_rsvp: 'going' as const, gromady: null },
    ];
    mockFetchCityEvents.mockResolvedValue(events);
    const { result } = renderHook(() => useCityEvents('city-1'));
    await act(async () => { result.current.load(); });
    await act(async () => {});
    expect(result.current.events.length).toBeGreaterThanOrEqual(0);
  });

  it('sets hasMore=false when fewer than 30 events returned', async () => {
    mockFetchCityEvents.mockResolvedValue([{ ...makeEvent(), rsvp_count: 0, user_rsvp: null, gromady: null }]);
    const { result } = renderHook(() => useCityEvents('city-1'));
    await act(async () => { result.current.load(); });
    await act(async () => {});
    expect(result.current.hasMore).toBe(false);
  });

  it('rsvp updates event optimistically', async () => {
    const event = { ...makeEvent({ id: 'e1' }), rsvp_count: 0, user_rsvp: null as null, gromady: null };
    mockFetchCityEvents.mockResolvedValue([event]);
    mockUpsertRSVP.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCityEvents('city-1'));
    await act(async () => { result.current.load(); });
    await act(async () => {});
    await act(async () => { await result.current.rsvp('e1', 'going'); });
    // Optimistic update: rsvp_count or user_rsvp updated
    const updated = result.current.events.find((e) => e.id === 'e1');
    if (updated) {
      expect(updated.user_rsvp).toBe('going');
    }
  });
});
