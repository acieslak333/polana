import { supabase } from '@/services/supabase';
import type { EventRow, RsvpStatus } from '@polana/db-types';
import { trackEvent } from '@/services/analytics';

export type { EventRow, RsvpStatus };

export type EventWithRSVP = EventRow & {
  rsvp_count: number;
  user_rsvp: 'going' | 'maybe' | 'not_going' | null;
  gromady: { name: string; avatar_config: Record<string, unknown> } | null;
};

const EVENT_QUERY = `
  id, gromada_id, created_by, title, description, location_name,
  location_point, city_id, starts_at, ends_at, max_attendees, is_public,
  is_auto_generated, event_type, status, created_at,
  gromady(name, avatar_config),
  event_rsvps(user_id, status)
`;

export async function fetchCityEvents(
  cityId: string,
  userId: string,
  page = 0,
): Promise<EventWithRSVP[]> {
  const from = page * 30;
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_QUERY)
    .eq('city_id', cityId)
    .eq('status', 'upcoming')
    .order('starts_at')
    .range(from, from + 29);
  if (error) throw error;

  return (data ?? []).map((e: Record<string, unknown>) => ({
    ...e,
    rsvp_count: (e.event_rsvps as Array<{ status: string }> ?? []).filter((r) => r.status === 'going').length,
    user_rsvp: (e.event_rsvps as Array<{ user_id: string; status: string }> ?? []).find((r) => r.user_id === userId)?.status ?? null,
    gromady: (e.gromady as EventWithRSVP['gromady']) ?? null,
  })) as EventWithRSVP[];
}

export async function fetchEvent(id: string, userId: string): Promise<EventWithRSVP> {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_QUERY)
    .eq('id', id)
    .single();
  if (error) throw error;
  const e = data as Record<string, unknown>;
  return {
    ...e,
    rsvp_count: (e.event_rsvps as Array<{ status: string }> ?? []).filter((r) => r.status === 'going').length,
    user_rsvp: (e.event_rsvps as Array<{ user_id: string; status: string }> ?? []).find((r) => r.user_id === userId)?.status ?? null,
    gromady: (e.gromady as EventWithRSVP['gromady']) ?? null,
  } as EventWithRSVP;
}

export async function createEvent(payload: {
  gromada_id?: string | null;
  created_by: string;
  title: string;
  description?: string | null;
  location_name: string;
  city_id: string;
  starts_at: string;
  ends_at?: string | null;
  max_attendees?: number | null;
  is_public?: boolean;
  event_type: string;
}): Promise<EventRow> {
  const { data, error } = await supabase
    .from('events')
    .insert({ ...payload, status: 'upcoming' })
    .select()
    .single();
  if (error) throw error;
  return data as EventRow;
}

export async function upsertRSVP(
  eventId: string,
  userId: string,
  status: 'going' | 'maybe' | 'not_going',
): Promise<void> {
  const { error } = await supabase
    .from('event_rsvps')
    .upsert({ event_id: eventId, user_id: userId, status, responded_at: new Date().toISOString() });
  if (error) throw error;
  trackEvent(status === 'going' ? 'rsvp_event' : 'cancel_rsvp');
}

export async function cancelEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({ status: 'cancelled' })
    .eq('id', id);
  if (error) throw error;
}
