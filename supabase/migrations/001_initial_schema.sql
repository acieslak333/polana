-- ==========================================
-- EXTENSIONS
-- ==========================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- CITIES
-- ==========================================

CREATE TABLE public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'PL',
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Europe/Warsaw',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.cities (name, country_code, location, timezone) VALUES
  ('Warszawa', 'PL', ST_SetSRID(ST_MakePoint(21.0122, 52.2297), 4326), 'Europe/Warsaw'),
  ('Kraków',   'PL', ST_SetSRID(ST_MakePoint(19.9450, 50.0647), 4326), 'Europe/Warsaw'),
  ('Wrocław',  'PL', ST_SetSRID(ST_MakePoint(17.0385, 51.1079), 4326), 'Europe/Warsaw'),
  ('Łódź',     'PL', ST_SetSRID(ST_MakePoint(19.4560, 51.7592), 4326), 'Europe/Warsaw'),
  ('Gdańsk',   'PL', ST_SetSRID(ST_MakePoint(18.6466, 54.3520), 4326), 'Europe/Warsaw');

-- ==========================================
-- INTERESTS
-- ==========================================

CREATE TABLE public.interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_pl TEXT NOT NULL,
  name_en TEXT NOT NULL,
  emoji TEXT NOT NULL,
  category TEXT,
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.interests (name_pl, name_en, emoji, category) VALUES
  ('Ceramika', 'Ceramics', '🏺', 'creative'),
  ('Spacery z psami', 'Dog Walking', '🐕', 'outdoor'),
  ('Kawa i herbata', 'Coffee & Tea', '☕', 'social'),
  ('Gotowanie', 'Cooking', '🍳', 'creative'),
  ('Majsterkowanie', 'Tinkering', '🔧', 'creative'),
  ('Ogrodnictwo', 'Gardening', '🌱', 'outdoor'),
  ('Rower', 'Cycling', '🚲', 'sport'),
  ('Gry planszowe', 'Board Games', '🎲', 'social'),
  ('Fotografia', 'Photography', '📷', 'creative'),
  ('Programowanie', 'Coding', '💻', 'tech'),
  ('Joga', 'Yoga', '🧘', 'sport'),
  ('Książki', 'Books', '📚', 'social'),
  ('Bieganie', 'Running', '🏃', 'sport'),
  ('Matcha', 'Matcha', '🍵', 'social'),
  ('Siatkówka', 'Volleyball', '🏐', 'sport'),
  ('Badminton', 'Badminton', '🏸', 'sport'),
  ('Wspinaczka', 'Climbing', '🧗', 'sport'),
  ('Muzyka', 'Music', '🎵', 'creative'),
  ('Rysunek', 'Drawing', '🎨', 'creative'),
  ('Film', 'Film', '🎬', 'social'),
  ('Szydełkowanie', 'Crochet', '🧶', 'creative'),
  ('Piknik', 'Picnic', '🧺', 'outdoor'),
  ('Taniec', 'Dance', '💃', 'sport'),
  ('Medytacja', 'Meditation', '🧘‍♂️', 'wellness'),
  ('Języki obce', 'Languages', '🗣️', 'social');

-- ==========================================
-- PROFILES
-- ==========================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL CHECK (char_length(first_name) BETWEEN 1 AND 50),
  last_name TEXT CHECK (char_length(last_name) <= 50),
  nickname TEXT CHECK (char_length(nickname) <= 30),
  date_of_birth DATE NOT NULL,
  bio TEXT CHECK (char_length(bio) <= 200),
  city_id UUID REFERENCES public.cities(id),
  avatar_config JSONB DEFAULT '{}',
  custom_avatar_url TEXT,
  profile_color_scheme TEXT DEFAULT 'default',
  interests TEXT[] DEFAULT '{}',
  notifications_enabled BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'pl',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_interests (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  interest_id UUID REFERENCES public.interests(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, interest_id)
);

-- ==========================================
-- GROMADY
-- ==========================================

CREATE TYPE gromada_size AS ENUM ('small', 'medium', 'large');

CREATE TABLE public.gromady (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 60),
  avatar_config JSONB DEFAULT '{}',
  city_id UUID NOT NULL REFERENCES public.cities(id),
  size_type gromada_size NOT NULL DEFAULT 'medium',
  max_members INT NOT NULL DEFAULT 24,
  elder_id UUID REFERENCES public.profiles(id),
  member_count INT DEFAULT 0,
  description TEXT CHECK (char_length(description) <= 300),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dormant', 'archived')),
  total_meetings_count INT DEFAULT 0,
  meetings_this_month INT DEFAULT 0,
  meetings_this_week INT DEFAULT 0,
  favors_exchanged INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.gromada_interests (
  gromada_id UUID REFERENCES public.gromady(id) ON DELETE CASCADE,
  interest_id UUID REFERENCES public.interests(id) ON DELETE CASCADE,
  PRIMARY KEY (gromada_id, interest_id)
);

CREATE OR REPLACE FUNCTION check_max_gromada_interests()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.gromada_interests WHERE gromada_id = NEW.gromada_id) >= 3 THEN
    RAISE EXCEPTION 'Gromada can have maximum 3 interests';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_gromada_interests
  BEFORE INSERT ON public.gromada_interests
  FOR EACH ROW EXECUTE FUNCTION check_max_gromada_interests();

CREATE TABLE public.gromada_members (
  gromada_id UUID REFERENCES public.gromady(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('elder', 'member', 'newcomer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (gromada_id, user_id)
);

CREATE OR REPLACE FUNCTION check_max_user_gromady()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.gromada_members WHERE user_id = NEW.user_id) >= 3 THEN
    RAISE EXCEPTION 'User can be in maximum 3 gromady';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_user_gromady
  BEFORE INSERT ON public.gromada_members
  FOR EACH ROW EXECUTE FUNCTION check_max_user_gromady();

CREATE OR REPLACE FUNCTION update_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.gromady SET member_count = member_count + 1 WHERE id = NEW.gromada_id;
    IF (SELECT created_at FROM public.gromady WHERE id = NEW.gromada_id) < NOW() - INTERVAL '30 days' THEN
      NEW.role := 'newcomer';
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.gromady SET member_count = member_count - 1 WHERE id = OLD.gromada_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_member_count
  AFTER INSERT OR DELETE ON public.gromada_members
  FOR EACH ROW EXECUTE FUNCTION update_member_count();

-- ==========================================
-- EVENTS
-- ==========================================

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gromada_id UUID REFERENCES public.gromady(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 100),
  description TEXT CHECK (char_length(description) <= 500),
  location_name TEXT NOT NULL,
  location_point GEOGRAPHY(POINT, 4326),
  city_id UUID REFERENCES public.cities(id),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  max_attendees INT CHECK (max_attendees >= 2),
  is_public BOOLEAN DEFAULT false,
  is_auto_generated BOOLEAN DEFAULT false,
  event_type TEXT CHECK (event_type IN (
    'meetup', 'workshop', 'sport', 'walk', 'coffee',
    'picnic', 'games', 'talk', 'other'
  )) DEFAULT 'meetup',
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION check_max_gromada_events()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.gromada_id IS NOT NULL AND (
    SELECT COUNT(*) FROM public.events
    WHERE gromada_id = NEW.gromada_id AND status = 'upcoming'
  ) >= 5 THEN
    RAISE EXCEPTION 'Gromada can have maximum 5 upcoming events';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_gromada_events
  BEFORE INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION check_max_gromada_events();

CREATE TABLE public.event_rsvps (
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  responded_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- ==========================================
-- POSTS & COMMENTS
-- ==========================================

CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gromada_id UUID REFERENCES public.gromady(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT CHECK (char_length(content) <= 5000),
  media_urls TEXT[] DEFAULT '{}',
  media_types TEXT[] DEFAULT '{}',
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, post_id, emoji),
  UNIQUE (user_id, comment_id, emoji),
  CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- FAVORS
-- ==========================================

CREATE TABLE public.favor_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gromada_id UUID REFERENCES public.gromady(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.profiles(id),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 5 AND 300),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'helped', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.favor_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  favor_request_id UUID NOT NULL REFERENCES public.favor_requests(id) ON DELETE CASCADE,
  offered_by UUID NOT NULL REFERENCES public.profiles(id),
  message TEXT CHECK (char_length(message) <= 200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- CROSSOVERS
-- ==========================================

CREATE TABLE public.crossover_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_gromada_id UUID NOT NULL REFERENCES public.gromady(id) ON DELETE CASCADE,
  to_gromada_id UUID NOT NULL REFERENCES public.gromady(id) ON DELETE CASCADE,
  proposed_by UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 100),
  description TEXT CHECK (char_length(description) <= 500),
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'happening', 'completed', 'declined')),
  interest_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (from_gromada_id != to_gromada_id)
);

-- ==========================================
-- CHAT
-- ==========================================

CREATE TYPE chat_type AS ENUM ('gromada', 'event', 'direct');

CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type chat_type NOT NULL,
  gromada_id UUID REFERENCES public.gromady(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  participant_1 UUID REFERENCES public.profiles(id),
  participant_2 UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (type = 'gromada' AND gromada_id IS NOT NULL) OR
    (type = 'event' AND event_id IS NOT NULL) OR
    (type = 'direct' AND participant_1 IS NOT NULL AND participant_2 IS NOT NULL)
  )
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.chat_mutes (
  chat_room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  muted_until TIMESTAMPTZ,
  PRIMARY KEY (chat_room_id, user_id)
);

-- ==========================================
-- FRIENDSHIPS
-- ==========================================

CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- ==========================================
-- ALLIES
-- ==========================================

CREATE TABLE public.gromada_allies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gromada_id UUID NOT NULL REFERENCES public.gromady(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_category TEXT,
  offer_text TEXT CHECK (char_length(offer_text) <= 150),
  contact_email TEXT,
  is_active BOOLEAN DEFAULT true,
  starts_at DATE NOT NULL,
  expires_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- GENERATIVE NAMES
-- ==========================================

CREATE TABLE public.name_adjectives (
  id SERIAL PRIMARY KEY,
  word_pl TEXT NOT NULL,
  word_en TEXT NOT NULL
);

CREATE TABLE public.name_animals (
  id SERIAL PRIMARY KEY,
  word_pl TEXT NOT NULL,
  word_en TEXT NOT NULL
);

CREATE TABLE public.name_suffixes (
  id SERIAL PRIMARY KEY,
  word_pl TEXT NOT NULL,
  word_en TEXT NOT NULL
);

INSERT INTO public.name_adjectives (word_pl, word_en) VALUES
  ('Szarżujące', 'Charging'), ('Nocne', 'Nocturnal'), ('Dzielne', 'Brave'),
  ('Wędrowne', 'Wandering'), ('Radosne', 'Joyful'), ('Ciche', 'Quiet'),
  ('Odważne', 'Bold'), ('Skoczne', 'Bouncy'), ('Tajemnicze', 'Mysterious'),
  ('Leniwe', 'Lazy'), ('Bystre', 'Keen'), ('Kosmiczne', 'Cosmic'),
  ('Leśne', 'Forest'), ('Magiczne', 'Magical'), ('Zuchwałe', 'Audacious');

INSERT INTO public.name_animals (word_pl, word_en) VALUES
  ('Chomiki', 'Hamsters'), ('Wydry', 'Otters'), ('Lisy', 'Foxes'),
  ('Sowy', 'Owls'), ('Jeże', 'Hedgehogs'), ('Kapibary', 'Capybaras'),
  ('Borsuki', 'Badgers'), ('Wiewiórki', 'Squirrels'), ('Żaby', 'Frogs'),
  ('Kruki', 'Ravens'), ('Koty', 'Cats'), ('Niedźwiedzie', 'Bears'),
  ('Pandy', 'Pandas'), ('Wilki', 'Wolves'), ('Bobry', 'Beavers');

INSERT INTO public.name_suffixes (word_pl, word_en) VALUES
  ('Nocy', 'of the Night'), ('Świtu', 'of Dawn'), ('Lasu', 'of the Forest'),
  ('Polany', 'of the Clearing'), ('Gór', 'of the Mountains'), ('Rzeki', 'of the River'),
  ('Miasta', 'of the City'), ('Parku', 'of the Park'), ('Ognia', 'of Fire'),
  ('Deszczu', 'of Rain'), ('Wiatru', 'of the Wind'), ('Mgły', 'of the Mist');

CREATE OR REPLACE FUNCTION generate_gromada_name()
RETURNS TEXT AS $$
DECLARE
  adj TEXT;
  animal TEXT;
  suffix TEXT;
BEGIN
  SELECT word_pl INTO adj FROM public.name_adjectives ORDER BY RANDOM() LIMIT 1;
  SELECT word_pl INTO animal FROM public.name_animals ORDER BY RANDOM() LIMIT 1;
  SELECT word_pl INTO suffix FROM public.name_suffixes ORDER BY RANDOM() LIMIT 1;
  RETURN adj || ' ' || animal || ' ' || suffix;
END;
$$ LANGUAGE plpgsql;

-- Trigger: auto-create chat room for new gromada
CREATE OR REPLACE FUNCTION create_gromada_chat_room()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chat_rooms (type, gromada_id)
  VALUES ('gromada', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_gromada_chat
  AFTER INSERT ON public.gromady
  FOR EACH ROW EXECUTE FUNCTION create_gromada_chat_room();
