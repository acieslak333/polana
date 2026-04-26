// All database enum types — single source of truth.
// Match exactly the CHECK constraints in 001_initial_schema.sql.

export type GromadaStatus = 'active' | 'dormant' | 'archived';
export type GromadaSizeType = 'small' | 'medium' | 'large';
export type MemberRole = 'elder' | 'member' | 'newcomer';

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export type EventType = 'meetup' | 'workshop' | 'sport' | 'walk' | 'coffee' | 'picnic' | 'games' | 'talk' | 'other';

export type RsvpStatus = 'going' | 'maybe' | 'not_going';

export type FavorStatus = 'open' | 'helped' | 'expired';

export type CrossoverStatus = 'proposed' | 'accepted' | 'happening' | 'completed' | 'rejected';

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted';
export type FriendshipDbStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved';

export type ChatType = 'gromada' | 'event' | 'direct';

export type Language = 'pl' | 'en' | 'uk';
