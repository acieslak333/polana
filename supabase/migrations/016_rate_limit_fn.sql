-- ==========================================
-- RATE LIMIT UPSERT FUNCTION
-- Called by the security.ts Edge Function
-- shared module. Returns the updated count
-- for the current window.
-- ==========================================

CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_user_id      UUID,
  p_endpoint     TEXT,
  p_window_start TIMESTAMPTZ
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER  -- runs as table owner to bypass RLS
AS $$
DECLARE
  v_count INT;
BEGIN
  INSERT INTO public.api_rate_limits (user_id, endpoint, window_start, request_count)
  VALUES (p_user_id, p_endpoint, p_window_start, 1)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET request_count = api_rate_limits.request_count + 1
  RETURNING request_count INTO v_count;

  RETURN v_count;
END;
$$;

-- Only callable from service role (Edge Functions)
REVOKE ALL ON FUNCTION increment_rate_limit(UUID, TEXT, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION increment_rate_limit(UUID, TEXT, TIMESTAMPTZ) FROM authenticated;

COMMENT ON FUNCTION increment_rate_limit IS
  'Atomic upsert for sliding-window rate limiting. Returns new request count for the window. Service role only.';
