// All database table row types — single source of truth.
// Derived from supabase/migrations/001_initial_schema.sql + later migrations.
// Import these instead of defining inline types in services/api/*.ts.

import type {
  GromadaStatus, GromadaSizeType, MemberRole,
  EventStatus, EventType, RsvpStatus,
  FavorStatus, CrossoverStatus,
  FriendshipDbStatus, ReportReason, ReportStatus, ChatType,
} from './enums';

// Shared profile shape used in joins across many tables
export interface ProfileSnippet {
  id: string;
  first_name: string;
  nickname: string | null;
  avatar_config: Record<string, unknown>;
}

// ─── Profiles ────────────────────────────────────────────────────────────────

export interface ProfileRow {
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
  push_token: string | null;
  push_token_updated_at: string | null;
  is_banned: boolean;
  created_at: string;
  last_active_at: string;
}

export interface PublicProfile {
  id: string;
  first_name: string;
  nickname: string | null;
  bio: string | null;
  avatar_config: Record<string, unknown>;
  custom_avatar_url: string | null;
  city_id: string | null;
}

// ─── Gromady ────────────────────────────────────────────────────────────────

export interface GromadaRow {
  id: string;
  name: string;
  avatar_config: Record<string, unknown>;
  city_id: string;
  size_type: GromadaSizeType;
  max_members: number;
  elder_id: string | null;
  member_count: number;
  description: string | null;
  last_activity_at: string;
  status: GromadaStatus;
  total_meetings_count: number;
  meetings_this_month: number;
  meetings_this_week: number;
  favors_exchanged: number;
  created_at: string;
}

export interface GromadaMember {
  gromada_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  profiles?: ProfileSnippet | null;
}

export interface GromadaInterest {
  gromada_id: string;
  interest_id: string;
}

export interface GromadaAlly {
  id: string;
  gromada_id: string;
  business_name: string;
  business_category: string | null;
  offer_text: string | null;
  contact_email: string | null;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export interface EventRow {
  id: string;
  gromada_id: string | null;
  created_by: string;
  title: string;
  description: string | null;
  location_name: string;
  location_point: string | null;
  city_id: string | null;
  starts_at: string;
  ends_at: string | null;
  max_attendees: number | null;
  is_public: boolean;
  is_auto_generated: boolean;
  event_type: EventType;
  status: EventStatus;
  created_at: string;
}

export interface EventRsvp {
  event_id: string;
  user_id: string;
  status: RsvpStatus;
  responded_at: string;
}

// ─── Posts & Comments ────────────────────────────────────────────────────────

export interface PostRow {
  id: string;
  gromada_id: string | null;
  author_id: string;
  content: string | null;
  media_urls: string[];
  media_types: string[];
  event_id: string | null;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  content: string;
  is_hidden: boolean;
  created_at: string;
}

export interface Reaction {
  id: string;
  user_id: string;
  post_id: string | null;
  comment_id: string | null;
  emoji: string;
  created_at: string;
}

export interface ReportRow {
  id: string;
  reporter_id: string;
  post_id: string | null;
  comment_id: string | null;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  created_at: string;
  // Joined fields (from moderation service)
  post_content?: string | null;
  comment_content?: string | null;
  reporter_name?: string | null;
}

// ─── Favors ──────────────────────────────────────────────────────────────────

export interface FavorRequest {
  id: string;
  gromada_id: string | null;
  requested_by: string;
  description: string;
  expires_at: string;
  status: FavorStatus;
  created_at: string;
  profiles?: ProfileSnippet | null;
  favor_offers?: FavorOffer[];
}

export interface FavorOffer {
  id: string;
  favor_request_id: string;
  offered_by: string;
  message: string | null;
  created_at: string;
}

// ─── Crossovers ──────────────────────────────────────────────────────────────

export interface CrossoverProposal {
  id: string;
  from_gromada_id: string;
  to_gromada_id: string;
  proposed_by: string;
  title: string;
  description: string | null;
  status: CrossoverStatus;
  vote_count: number;
  created_at: string;
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export interface ChatRoom {
  id: string;
  type: ChatType;
  gromada_id: string | null;
  event_id: string | null;
  participant_1: string | null;
  participant_2: string | null;
  created_at: string;
  // Joined / computed
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  display_name?: string;
  display_avatar?: Record<string, unknown>;
}

export interface Message {
  id: string;
  chat_room_id: string;
  sender_id: string;
  body: string;
  media_url: string | null;
  created_at: string;
  profiles?: ProfileSnippet | null;
}

// ─── Friendships ─────────────────────────────────────────────────────────────

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipDbStatus;
  created_at: string;
}

// ─── Invites ─────────────────────────────────────────────────────────────────

export interface GromadaInvite {
  id: string;
  gromada_id: string;
  created_by: string;
  code: string;
  expires_at: string;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

// ─── Safety ──────────────────────────────────────────────────────────────────

export interface UserBlock {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface ChatMute {
  chat_room_id: string;
  user_id: string;
  muted_until: string | null;
}

// ─── Interests & Cities ──────────────────────────────────────────────────────

export interface Interest {
  id: string;
  name_pl: string;
  name_en: string;
  emoji: string;
  category: string | null;
  is_default: boolean;
}

export interface City {
  id: string;
  name: string;
  country_code: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
}
