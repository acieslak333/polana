-- ==========================================
-- SCALABILITY & MAINTENANCE
-- Sprint 21: materialized view for warmth score,
-- counter resets, query timeout guards,
-- rate limit pruning.
-- ==========================================

-- ==========================================
-- MATERIALIZED VIEW: gromada_warmth_scores
--
-- WHY: the warmth score is currently recomputed
-- on every info screen load by reading three
-- columns off gromady. As we add more signals
-- (e.g., favor velocity, crossover completion)
-- the formula will grow. A materialized view
-- refreshed hourly isolates the computation
-- and keeps the query planner happy.
--
-- Formula: (meetings_this_month × 3)
--        + (favors_exchanged × 2)
--        + member_count
-- ==========================================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.gromada_warmth_scores AS
SELECT
  g.id                                      AS gromada_id,
  g.city_id,
  -- Score components
  (g.meetings_this_month * 3
   + g.favors_exchanged * 2
   + g.member_count)                        AS warmth_score,
  -- Capped 0–100 for display in WarmthIndicator
  LEAST(
    100,
    GREATEST(
      0,
      (g.meetings_this_month * 3 + g.favors_exchanged * 2 + g.member_count)
    )
  )                                          AS warmth_pct,
  -- Tier label for campfire icon
  CASE
    WHEN (g.meetings_this_month * 3 + g.favors_exchanged * 2 + g.member_count) >= 60 THEN 'blazing'
    WHEN (g.meetings_this_month * 3 + g.favors_exchanged * 2 + g.member_count) >= 30 THEN 'warm'
    WHEN (g.meetings_this_month * 3 + g.favors_exchanged * 2 + g.member_count) >= 10 THEN 'kindling'
    ELSE 'cold'
  END                                        AS warmth_tier,
  NOW()                                      AS refreshed_at
FROM public.gromady g
WHERE g.status = 'active';

-- Index on the materialized view itself (non-CONCURRENTLY since view just created)
CREATE UNIQUE INDEX IF NOT EXISTS idx_warmth_gromada_id
  ON public.gromada_warmth_scores (gromada_id);

CREATE INDEX IF NOT EXISTS idx_warmth_city
  ON public.gromada_warmth_scores (city_id, warmth_score DESC);

-- Read access for authenticated clients (needed by WarmthIndicator component)
ALTER MATERIALIZED VIEW public.gromada_warmth_scores OWNER TO postgres;
GRANT SELECT ON public.gromada_warmth_scores TO authenticated;

COMMENT ON MATERIALIZED VIEW public.gromada_warmth_scores IS
  'Hourly-refreshed warmth scores. Refresh via pg_cron job warmth-score-refresh.';

-- ==========================================
-- pg_cron: refresh warmth scores every hour
-- ==========================================

SELECT cron.schedule(
  'warmth-score-refresh',
  '0 * * * *',  -- top of every hour
  $$
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.gromada_warmth_scores;
  $$
);

-- ==========================================
-- pg_cron: reset monthly meeting counters
-- Runs at 00:05 on the 1st of each month.
-- ==========================================

SELECT cron.schedule(
  'reset-meetings-monthly',
  '5 0 1 * *',
  $$
    UPDATE public.gromady
       SET meetings_this_month = 0
     WHERE status != 'archived';
  $$
);

-- ==========================================
-- pg_cron: reset weekly meeting counters
-- Runs at 00:05 every Monday.
-- ==========================================

SELECT cron.schedule(
  'reset-meetings-weekly',
  '5 0 * * 1',
  $$
    UPDATE public.gromady
       SET meetings_this_week = 0
     WHERE status != 'archived';
  $$
);

-- ==========================================
-- pg_cron: expire open favor_requests
-- Runs daily at 01:00 UTC.
-- ==========================================

SELECT cron.schedule(
  'expire-favors',
  '0 1 * * *',
  $$
    UPDATE public.favor_requests
       SET status = 'expired'
     WHERE status = 'open'
       AND expires_at < NOW();
  $$
);

-- ==========================================
-- pg_cron: prune api_rate_limits
-- Keep only the last hour; runs hourly +5min.
-- ==========================================

SELECT cron.schedule(
  'prune-rate-limits',
  '5 * * * *',
  $$
    DELETE FROM public.api_rate_limits
     WHERE window_start < NOW() - INTERVAL '2 hours';
  $$
);

-- ==========================================
-- pg_cron: mark dormant gromady
-- A gromada with no activity in 30 days → dormant.
-- Runs weekly on Sunday at 02:00 UTC.
-- ==========================================

SELECT cron.schedule(
  'dormant-check',
  '0 2 * * 0',
  $$
    UPDATE public.gromady
       SET status = 'dormant'
     WHERE status = 'active'
       AND last_activity_at < NOW() - INTERVAL '30 days';
  $$
);

-- ==========================================
-- ANALYZE: refresh query planner statistics
-- after this migration runs.
-- ==========================================

ANALYZE public.gromada_members;
ANALYZE public.posts;
ANALYZE public.messages;
ANALYZE public.events;
ANALYZE public.profiles;
ANALYZE public.gromady;
