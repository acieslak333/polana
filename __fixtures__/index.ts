// Factory functions for typed test data.
// Use these in tests instead of raw object literals — keeps tests resilient to type changes.

import type { Post } from '@/services/api/posts';
import type { GromadaRow } from '@/services/api/gromady';
import type { EventRow } from '@/services/api/events';
import type { PublicProfile } from '@/services/api/users';
import type { Message } from '@/services/api/messages';

let _counter = 0;
const uid = () => `test-${++_counter}-${Math.random().toString(36).slice(2, 7)}`;
const iso = (offsetDays = 0) => new Date(Date.now() + offsetDays * 86400000).toISOString();

export function makeProfile(overrides: Partial<PublicProfile> = {}): PublicProfile {
  return {
    id: uid(),
    first_name: 'Test',
    nickname: null,
    bio: null,
    avatar_config: { base: 'hamster', color: '#C4705A' },
    custom_avatar_url: null,
    city_id: 'warszawa-id',
    ...overrides,
  };
}

export function makeGromada(overrides: Partial<GromadaRow> = {}): GromadaRow {
  return {
    id: uid(),
    name: 'Radosne Chomiki Nocy',
    avatar_config: {},
    city_id: 'warszawa-id',
    size_type: 'medium',
    max_members: 24,
    elder_id: null,
    member_count: 5,
    description: null,
    last_activity_at: iso(),
    status: 'active',
    total_meetings_count: 0,
    meetings_this_month: 0,
    meetings_this_week: 0,
    favors_exchanged: 0,
    created_at: iso(-30),
    ...overrides,
  };
}

export function makeEvent(overrides: Partial<EventRow> = {}): EventRow {
  return {
    id: uid(),
    gromada_id: null,
    created_by: uid(),
    title: 'Test Event',
    description: null,
    location_name: 'Warszawa, Łazienki',
    location_point: null,
    city_id: 'warszawa-id',
    starts_at: iso(3),
    ends_at: null,
    max_attendees: null,
    is_public: false,
    is_auto_generated: false,
    event_type: 'meetup',
    status: 'upcoming',
    created_at: iso(),
    ...overrides,
  };
}

export function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: uid(),
    gromada_id: uid(),
    author_id: uid(),
    content: 'Test post content',
    media_urls: [],
    media_types: [],
    event_id: null,
    is_hidden: false,
    created_at: iso(),
    updated_at: iso(),
    reactions: [],
    comment_count: 0,
    profiles: { id: uid(), first_name: 'Test', nickname: null, avatar_config: {} },
    gromady: null,
    ...overrides,
  } as Post;
}

export function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: uid(),
    chat_room_id: uid(),
    sender_id: uid(),
    body: 'Test message',
    media_url: null,
    created_at: iso(),
    profiles: null,
    ...overrides,
  } as Message;
}
