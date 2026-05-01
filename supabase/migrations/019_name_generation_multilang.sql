-- supabase/migrations/019_name_generation_multilang.sql
-- ==========================================
-- NAME GENERATION: multi-language support
-- Adds language column to word tables,
-- a word-order pattern table, and updates
-- generate_gromada_name() to be language-aware.
-- ==========================================

ALTER TABLE public.name_adjectives ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'pl';
ALTER TABLE public.name_animals    ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'pl';
ALTER TABLE public.name_suffixes   ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'pl';

UPDATE public.name_adjectives SET language = 'pl' WHERE language IS NULL;
UPDATE public.name_animals    SET language = 'pl' WHERE language IS NULL;
UPDATE public.name_suffixes   SET language = 'pl' WHERE language IS NULL;

CREATE INDEX IF NOT EXISTS idx_name_adj_language ON public.name_adjectives (language);
CREATE INDEX IF NOT EXISTS idx_name_ani_language ON public.name_animals (language);
CREATE INDEX IF NOT EXISTS idx_name_suf_language ON public.name_suffixes (language);

CREATE TABLE IF NOT EXISTS public.name_patterns (
  language TEXT PRIMARY KEY,
  pattern  TEXT NOT NULL DEFAULT '{adj} {animal} {suffix}'
);

ALTER TABLE public.name_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "name_patterns_select" ON public.name_patterns FOR SELECT USING (true);

INSERT INTO public.name_patterns (language, pattern) VALUES
  ('pl', '{adj} {animal} {suffix}'),
  ('en', '{adj} {animal} {suffix}'),
  ('uk', '{adj} {animal} {suffix}')
ON CONFLICT (language) DO NOTHING;

INSERT INTO public.name_adjectives (word_pl, word_en, language) VALUES
  ('Bold','Bold','en'),('Wandering','Wandering','en'),('Joyful','Joyful','en'),
  ('Brave','Brave','en'),('Quiet','Quiet','en'),('Cosmic','Cosmic','en'),
  ('Forest','Forest','en'),('Magical','Magical','en'),('Nocturnal','Nocturnal','en'),
  ('Bouncy','Bouncy','en')
ON CONFLICT DO NOTHING;

INSERT INTO public.name_animals (word_pl, word_en, language) VALUES
  ('Otters','Otters','en'),('Foxes','Foxes','en'),('Owls','Owls','en'),
  ('Hedgehogs','Hedgehogs','en'),('Badgers','Badgers','en'),('Ravens','Ravens','en'),
  ('Beavers','Beavers','en'),('Bears','Bears','en'),('Squirrels','Squirrels','en'),
  ('Capybaras','Capybaras','en')
ON CONFLICT DO NOTHING;

INSERT INTO public.name_suffixes (word_pl, word_en, language) VALUES
  ('of the Night','of the Night','en'),('of Dawn','of Dawn','en'),
  ('of the Forest','of the Forest','en'),('of the Clearing','of the Clearing','en'),
  ('of the Mountains','of the Mountains','en'),('of the River','of the River','en'),
  ('of the City','of the City','en'),('of the Park','of the Park','en'),
  ('of the Mist','of the Mist','en')
ON CONFLICT DO NOTHING;

INSERT INTO public.name_adjectives (word_pl, word_en, language) VALUES
  ('Сміливі','Bold','uk'),('Мандрівні','Wandering','uk'),('Радісні','Joyful','uk'),
  ('Хоробрі','Brave','uk'),('Тихі','Quiet','uk'),('Космічні','Cosmic','uk'),
  ('Лісові','Forest','uk'),('Магічні','Magical','uk'),('Нічні','Nocturnal','uk'),
  ('Стрімкі','Bouncy','uk')
ON CONFLICT DO NOTHING;

INSERT INTO public.name_animals (word_pl, word_en, language) VALUES
  ('Видри','Otters','uk'),('Лисиці','Foxes','uk'),('Сови','Owls','uk'),
  ('Їжаки','Hedgehogs','uk'),('Борсуки','Badgers','uk'),('Крукони','Ravens','uk'),
  ('Бобри','Beavers','uk'),('Ведмеді','Bears','uk'),('Білки','Squirrels','uk'),
  ('Капібари','Capybaras','uk')
ON CONFLICT DO NOTHING;

INSERT INTO public.name_suffixes (word_pl, word_en, language) VALUES
  ('Ночі','of the Night','uk'),('Світанку','of Dawn','uk'),
  ('Лісу','of the Forest','uk'),('Галявини','of the Clearing','uk'),
  ('Гір','of the Mountains','uk'),('Ріки','of the River','uk'),
  ('Міста','of the City','uk'),('Парку','of the Park','uk'),
  ('Туману','of the Mist','uk')
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION generate_gromada_name(p_language TEXT DEFAULT 'pl')
RETURNS TEXT AS $$
DECLARE
  v_lang    TEXT;
  v_pattern TEXT;
  v_adj     TEXT;
  v_animal  TEXT;
  v_suffix  TEXT;
  v_name    TEXT;
BEGIN
  v_lang := CASE
    WHEN EXISTS (SELECT 1 FROM public.name_adjectives WHERE language = p_language) THEN p_language
    WHEN EXISTS (SELECT 1 FROM public.name_adjectives WHERE language = 'en')       THEN 'en'
    ELSE 'pl'
  END;

  SELECT COALESCE(
    (SELECT pattern FROM public.name_patterns WHERE language = v_lang),
    '{adj} {animal} {suffix}'
  ) INTO v_pattern;

  -- Note: word_pl stores the word in whichever language the row's language column specifies (legacy column name)
  SELECT word_pl INTO v_adj    FROM public.name_adjectives WHERE language = v_lang ORDER BY RANDOM() LIMIT 1;
  SELECT word_pl INTO v_animal FROM public.name_animals    WHERE language = v_lang ORDER BY RANDOM() LIMIT 1;
  SELECT word_pl INTO v_suffix FROM public.name_suffixes   WHERE language = v_lang ORDER BY RANDOM() LIMIT 1;

  v_name := REPLACE(v_pattern, '{adj}',    v_adj);
  v_name := REPLACE(v_name,    '{animal}', v_animal);
  v_name := REPLACE(v_name,    '{suffix}', v_suffix);

  RETURN v_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_gromada_name IS
  'Generate a random Gromada name in the requested language. Fallback: p_language → en → pl.';
