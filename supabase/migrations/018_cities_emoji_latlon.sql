-- ==========================================
-- CITIES: add emoji + lat/lng columns
--
-- The map component previously had CITY_CENTERS
-- hardcoded in TypeScript. Moving coordinates
-- into the DB means any new city added via the
-- admin panel automatically works on the map.
--
-- emoji: displayed in the onboarding city picker.
-- lat/lng: plain FLOAT columns alongside the
--   existing GEOGRAPHY(POINT) column so the app
--   can read them without a PostGIS function call.
-- ==========================================

ALTER TABLE public.cities
  ADD COLUMN IF NOT EXISTS emoji TEXT NOT NULL DEFAULT '🏙️',
  ADD COLUMN IF NOT EXISTS lat   FLOAT,
  ADD COLUMN IF NOT EXISTS lng   FLOAT;

-- Back-fill coordinates from the existing GEOGRAPHY column
UPDATE public.cities SET
  lat = ST_Y(location::geometry),
  lng = ST_X(location::geometry);

-- Back-fill the 5 launch cities with their emojis
UPDATE public.cities SET emoji = '🏛️' WHERE name = 'Warszawa';
UPDATE public.cities SET emoji = '🏰' WHERE name = 'Kraków';
UPDATE public.cities SET emoji = '🌉' WHERE name = 'Wrocław';
UPDATE public.cities SET emoji = '🧵' WHERE name = 'Łódź';
UPDATE public.cities SET emoji = '⚓' WHERE name = 'Gdańsk';

COMMENT ON COLUMN public.cities.emoji IS 'Displayed in the onboarding city picker. Default 🏙️ for new cities until set in admin panel.';
COMMENT ON COLUMN public.cities.lat   IS 'Latitude for map centering. Derived from location GEOGRAPHY on insert.';
COMMENT ON COLUMN public.cities.lng   IS 'Longitude for map centering. Derived from location GEOGRAPHY on insert.';

-- Trigger: keep lat/lng in sync when location is updated
CREATE OR REPLACE FUNCTION sync_city_latlon()
RETURNS TRIGGER AS $$
BEGIN
  NEW.lat := ST_Y(NEW.location::geometry);
  NEW.lng := ST_X(NEW.location::geometry);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_sync_city_latlon
  BEFORE INSERT OR UPDATE OF location ON public.cities
  FOR EACH ROW EXECUTE FUNCTION sync_city_latlon();
