import { supabase } from '@/services/supabase';
import { fetchCityEvents, createEvent, upsertRSVP, cancelEvent } from '../events';
import { makeEvent } from '@/__fixtures__';
import { mockSuccess, mockError, mockSingle } from '@/__tests__/helpers/mockChain';

const FROM = supabase.from as jest.Mock;

beforeEach(() => { jest.clearAllMocks(); });

describe('fetchCityEvents', () => {
  it('returns events for a city', async () => {
    const rawEvents = [
      { ...makeEvent(), event_rsvps: [], gromady: null },
      { ...makeEvent(), event_rsvps: [{ user_id: 'u1', status: 'going' }], gromady: { name: 'Test', avatar_config: {} } },
    ];
    FROM.mockReturnValueOnce(mockSuccess(rawEvents));
    const result = await fetchCityEvents('city-1', 'u1', 0);
    expect(result).toHaveLength(2);
    expect(result[1].rsvp_count).toBe(1);
    expect(result[1].user_rsvp).toBe('going');
  });

  it('returns empty array when no events', async () => {
    FROM.mockReturnValueOnce(mockSuccess([]));
    const result = await fetchCityEvents('city-1', 'u1', 0);
    expect(result).toHaveLength(0);
  });

  it('throws on DB error', async () => {
    FROM.mockReturnValueOnce(mockError('DB error'));
    await expect(fetchCityEvents('city-1', 'u1', 0)).rejects.toThrow();
  });
});

describe('createEvent', () => {
  it('creates an event and returns it', async () => {
    const event = makeEvent({ title: 'New Event', status: 'upcoming' });
    FROM.mockReturnValueOnce(mockSingle(event));
    const result = await createEvent({
      created_by: 'u1',
      title: 'New Event',
      location_name: 'Park',
      city_id: 'city-1',
      starts_at: new Date().toISOString(),
      event_type: 'meetup',
    });
    expect(result.title).toBe('New Event');
    expect(result.status).toBe('upcoming');
  });
});

describe('upsertRSVP', () => {
  it('upserts going status', async () => {
    FROM.mockReturnValueOnce(mockSuccess(null));
    await expect(upsertRSVP('e1', 'u1', 'going')).resolves.not.toThrow();
    expect(FROM).toHaveBeenCalledWith('event_rsvps');
  });

  it('upserts not_going status', async () => {
    FROM.mockReturnValueOnce(mockSuccess(null));
    await expect(upsertRSVP('e1', 'u1', 'not_going')).resolves.not.toThrow();
  });
});

describe('cancelEvent', () => {
  it('updates event status to cancelled', async () => {
    FROM.mockReturnValueOnce(mockSuccess(null));
    await expect(cancelEvent('e1')).resolves.not.toThrow();
    expect(FROM).toHaveBeenCalledWith('events');
  });
});
