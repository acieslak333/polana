import { renderHook, act } from '@testing-library/react-native';
import { useFavors } from '../useFavors';
import * as favorsApi from '@/services/api/favors';

jest.mock('@/services/api/favors');
const mockFetch = favorsApi.fetchGromadaFavors as jest.Mock;
const mockCreate = favorsApi.createFavorRequest as jest.Mock;
const mockOffer = favorsApi.offerHelp as jest.Mock;
const mockMarkHelped = favorsApi.markFavorHelped as jest.Mock;

jest.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}));

const makeFavor = (overrides = {}) => ({
  id: `favor-${Math.random().toString(36).slice(2)}`,
  gromada_id: 'g1',
  requested_by: 'user-2',
  description: 'Need help moving furniture',
  expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  status: 'open' as const,
  created_at: new Date().toISOString(),
  profiles: null,
  ...overrides,
});

beforeEach(() => { jest.clearAllMocks(); });

describe('useFavors', () => {
  it('starts with empty favors', () => {
    mockFetch.mockResolvedValue([]);
    const { result } = renderHook(() => useFavors('g1'));
    expect(result.current.favors).toHaveLength(0);
    expect(result.current.loading).toBe(false);
  });

  it('loads favors on load()', async () => {
    const favors = [makeFavor(), makeFavor()];
    mockFetch.mockResolvedValue(favors);
    const { result } = renderHook(() => useFavors('g1'));
    await act(async () => { await result.current.load(); });
    expect(result.current.favors).toHaveLength(2);
  });

  it('create() adds a new favor', async () => {
    mockFetch.mockResolvedValue([]);
    const newFavor = makeFavor({ description: 'Need help' });
    mockCreate.mockResolvedValue(newFavor);
    const { result } = renderHook(() => useFavors('g1'));
    await act(async () => { await result.current.create('Need help'); });
    expect(result.current.favors.some((f) => f.description === 'Need help')).toBe(true);
  });

  it('offer() calls offerHelp API', async () => {
    mockFetch.mockResolvedValue([]);
    mockOffer.mockResolvedValue(undefined);
    const { result } = renderHook(() => useFavors('g1'));
    await act(async () => { await result.current.offer('favor-1', 'I can help!'); });
    expect(mockOffer).toHaveBeenCalled();
  });

  it('markHelped() updates favor status optimistically', async () => {
    const favor = makeFavor({ id: 'f1', status: 'open' as const });
    mockFetch.mockResolvedValue([favor]);
    mockMarkHelped.mockResolvedValue(undefined);
    const { result } = renderHook(() => useFavors('g1'));
    await act(async () => { await result.current.load(); });
    await act(async () => { await result.current.markHelped('f1'); });
    const updated = result.current.favors.find((f) => f.id === 'f1');
    if (updated) {
      expect(updated.status).toBe('helped');
    }
  });
});
