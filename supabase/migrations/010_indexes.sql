-- ==========================================
-- PERFORMANCE INDEXES
-- Sprint 21: every foreign key and every
-- column used in WHERE / ORDER BY gets an
-- index. All created CONCURRENTLY so they
-- can run on a live database without locking.
-- ==========================================

-- ==========================================
-- GROMADA_MEMBERS
-- Most-joined table in the app — appears in
-- almost every RLS policy and feed query.
-- ==========================================

-- membership lookup by gromada (member list, feed auth check)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gromada_members_gromada_id
  ON public.gromada_members (gromada_id);

-- membership lookup by user (my gromady list, 3-gromada limit trigger)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gromada_members_user_id
  ON public.gromada_members (user_id);

-- ==========================================
-- POSTS
-- Feed query: member's gromady, newest first,
-- hidden posts excluded.
-- ==========================================

-- chronological feed per gromada, visible posts only (partial index)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_gromada_created
  ON public.posts (gromada_id, created_at DESC)
  WHERE is_hidden = false;

-- author lookup (profile page: my posts)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_author_id
  ON public.posts (author_id);

-- moderation queue: find hidden posts quickly
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_is_hidden
  ON public.posts (is_hidden)
  WHERE is_hidden = true;

-- ==========================================
-- COMMENTS
-- Threaded comment loading per post.
-- ==========================================

-- all visible comments for a post, chronological
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post_created
  ON public.comments (post_id, created_at)
  WHERE is_hidden = false;

-- parent lookup for threading (find replies to a comment)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_parent_id
  ON public.comments (parent_comment_id)
  WHERE parent_comment_id IS NOT NULL;

-- author lookup (delete cascade, moderation)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_author_id
  ON public.comments (author_id);

-- ==========================================
-- REACTIONS
-- Loaded per post to render reaction bar.
-- ==========================================

-- all reactions on a post (reaction bar render)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reactions_post_id
  ON public.reactions (post_id)
  WHERE post_id IS NOT NULL;

-- user's reactions (toggle add/remove check)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reactions_user_id
  ON public.reactions (user_id);

-- ==========================================
-- MESSAGES
-- Chat pagination: newest-first per room,
-- then load-older scrolling upward.
-- ==========================================

-- newest messages first per chat room
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_room_created
  ON public.messages (chat_room_id, created_at DESC);

-- sender lookup (delete own messages, audit)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_id
  ON public.messages (sender_id);

-- ==========================================
-- CHAT_ROOMS
-- Participant lookup for RLS policies.
-- ==========================================

-- gromada-type rooms (membership check in RLS)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_rooms_gromada_id
  ON public.chat_rooms (gromada_id)
  WHERE gromada_id IS NOT NULL;

-- event-type rooms (RSVP check in RLS)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_rooms_event_id
  ON public.chat_rooms (event_id)
  WHERE event_id IS NOT NULL;

-- direct message rooms: find the DM between two specific users
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_rooms_p1
  ON public.chat_rooms (participant_1)
  WHERE type = 'direct';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_rooms_p2
  ON public.chat_rooms (participant_2)
  WHERE type = 'direct';

-- ==========================================
-- EVENTS
-- Map view: upcoming events near a city.
-- Feed: events for a gromada.
-- ==========================================

-- upcoming events per city, sorted by start time (map/list view)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_city_starts
  ON public.events (city_id, starts_at)
  WHERE status = 'upcoming';

-- events per gromada (calendar tab, max-events trigger)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_gromada_status
  ON public.events (gromada_id, status)
  WHERE gromada_id IS NOT NULL;

-- creator lookup (cancel own event, audit)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_created_by
  ON public.events (created_by);

-- PostGIS spatial index — without GIST, ST_DWithin is O(n)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_location_gist
  ON public.events USING GIST (location_point)
  WHERE location_point IS NOT NULL;

-- ==========================================
-- EVENT_RSVPS
-- RSVP count per event, user's own RSVP status.
-- ==========================================

-- all RSVPs for an event (count attendees, chat room access check)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_rsvps_event_id
  ON public.event_rsvps (event_id);

-- user's RSVPs (my calendar: events I'm going to)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_rsvps_user_id
  ON public.event_rsvps (user_id);

-- ==========================================
-- FAVOR_REQUESTS
-- Favor list per gromada, filter by status,
-- expiry cron job.
-- ==========================================

-- open favors per gromada (favor list in gromada panel)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favor_requests_gromada_status
  ON public.favor_requests (gromada_id, status);

-- expiry cron: find all open favors past their deadline
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favor_requests_expires
  ON public.favor_requests (expires_at)
  WHERE status = 'open';

-- requester lookup (my favors, delete own)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favor_requests_requested_by
  ON public.favor_requests (requested_by);

-- ==========================================
-- FAVOR_OFFERS
-- ==========================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favor_offers_request_id
  ON public.favor_offers (favor_request_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favor_offers_offered_by
  ON public.favor_offers (offered_by);

-- ==========================================
-- PROFILES
-- City filter (gromada suggestions by city),
-- dormant check (last_active_at),
-- ban check (is_banned).
-- ==========================================

-- users per city (onboarding gromada suggestions, admin user list)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_city_id
  ON public.profiles (city_id)
  WHERE city_id IS NOT NULL;

-- dormant check: last seen more than 30 days ago
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_last_active
  ON public.profiles (last_active_at DESC);

-- ban check: quickly find banned users (expected to be tiny set)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_is_banned
  ON public.profiles (is_banned)
  WHERE is_banned = true;

-- ==========================================
-- FRIENDSHIPS
-- Social graph lookups: my friends, pending
-- requests, blocked status.
-- ==========================================

-- outbound requests by sender
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friendships_requester_id
  ON public.friendships (requester_id);

-- inbound requests / acceptance (addressee_id in UPDATE policy)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friendships_addressee_id
  ON public.friendships (addressee_id);

-- blocked-status lookup (combine with status filter)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friendships_status
  ON public.friendships (status)
  WHERE status IN ('pending', 'blocked');

-- ==========================================
-- CROSSOVER_PROPOSALS
-- ==========================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crossovers_from_gromada
  ON public.crossover_proposals (from_gromada_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crossovers_to_gromada
  ON public.crossover_proposals (to_gromada_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crossovers_status
  ON public.crossover_proposals (status)
  WHERE status IN ('proposed', 'accepted', 'happening');

-- ==========================================
-- REPORTS
-- Moderation queue: pending reports, elder
-- lookup by gromada (requires joining post).
-- ==========================================

-- pending reports queue (admin panel, elder view)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_status
  ON public.reports (status)
  WHERE status = 'pending';

-- reporter lookup (see my own reports)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_reporter_id
  ON public.reports (reporter_id);

-- post reports (join path: report → post → gromada)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_post_id
  ON public.reports (post_id)
  WHERE post_id IS NOT NULL;

-- ==========================================
-- GROMADY
-- Elder lookup (RLS update check),
-- city filter (onboarding suggestions).
-- ==========================================

-- elder lookup (gromady_update_elder RLS policy)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gromady_elder_id
  ON public.gromady (elder_id)
  WHERE elder_id IS NOT NULL;

-- active gromady per city (onboarding, explore, map)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gromady_city_status
  ON public.gromady (city_id, status)
  WHERE status = 'active';

-- activity timestamp (dormant-check cron)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gromady_last_activity
  ON public.gromady (last_activity_at DESC)
  WHERE status = 'active';

-- ==========================================
-- GROMADA_INTERESTS
-- Interest-based matching (onboarding
-- suggestions, explore filter).
-- ==========================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gromada_interests_interest_id
  ON public.gromada_interests (interest_id);

-- ==========================================
-- USER_INTERESTS
-- ==========================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interests_interest_id
  ON public.user_interests (interest_id);

-- ==========================================
-- GROMADA_ALLIES
-- ==========================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_allies_gromada_id
  ON public.gromada_allies (gromada_id)
  WHERE is_active = true;

-- ==========================================
-- APP_LOGS (from Sprint 18 migration 008)
-- Log retention cron reads by created_at.
-- ==========================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_app_logs_created_at
  ON public.app_logs (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_app_logs_function_name
  ON public.app_logs (function_name, created_at DESC);

-- ==========================================
-- COMMENTS on indexes (query they serve)
-- ==========================================

COMMENT ON INDEX idx_gromada_members_gromada_id IS 'Member list per gromada; feed RLS auth check';
COMMENT ON INDEX idx_gromada_members_user_id    IS 'My gromady list; 3-gromada trigger; profile page';
COMMENT ON INDEX idx_posts_gromada_created      IS 'Chronological feed per gromada, visible posts only';
COMMENT ON INDEX idx_messages_room_created      IS 'Chat pagination: newest-first per room';
COMMENT ON INDEX idx_events_city_starts         IS 'Map/list: upcoming events sorted by start time';
COMMENT ON INDEX idx_events_location_gist       IS 'PostGIS spatial query: events within radius';
COMMENT ON INDEX idx_profiles_last_active       IS 'Dormant-check cron: users inactive > 30 days';
