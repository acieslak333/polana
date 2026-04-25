-- Seed data for development/testing only.
-- Run this AFTER 001 and 002 migrations.
-- Do NOT run in production.

-- Example test gromady (no elder yet — set after a test user registers)
INSERT INTO public.gromady (name, city_id, size_type, max_members, description, status)
SELECT
  generate_gromada_name(),
  (SELECT id FROM public.cities WHERE name = 'Warszawa'),
  'medium',
  24,
  'Testowa gromada do developmentu',
  'active'
FROM generate_series(1, 3);

-- Example test events linked to first gromada
INSERT INTO public.events (gromada_id, created_by, title, location_name, starts_at, event_type, is_auto_generated)
SELECT
  (SELECT id FROM public.gromady LIMIT 1),
  -- created_by needs a real user — skip in pure seed, set manually after first user
  NULL,
  'Testowe spotkanie',
  'Park Łazienkowski, Warszawa',
  NOW() + INTERVAL '3 days',
  'meetup',
  true
WHERE false; -- disabled by default; remove WHERE clause to enable

-- Verify seed
DO $$
BEGIN
  RAISE NOTICE 'Cities: %', (SELECT COUNT(*) FROM public.cities);
  RAISE NOTICE 'Interests: %', (SELECT COUNT(*) FROM public.interests);
  RAISE NOTICE 'Name adjectives: %', (SELECT COUNT(*) FROM public.name_adjectives);
  RAISE NOTICE 'Name animals: %', (SELECT COUNT(*) FROM public.name_animals);
  RAISE NOTICE 'Name suffixes: %', (SELECT COUNT(*) FROM public.name_suffixes);
  RAISE NOTICE 'Sample name: %', generate_gromada_name();
END $$;
