-- ==========================================
-- AUDIT LOG
-- Sprint 21: immutable record of sensitive
-- admin and moderation actions.
-- ==========================================

-- ==========================================
-- TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id          BIGSERIAL    PRIMARY KEY,
  table_name  TEXT         NOT NULL,
  record_id   UUID         NOT NULL,
  action      TEXT         NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_by  UUID,        -- NULL if changed by a trigger or cron (no user context)
  old_data    JSONB,
  new_data    JSONB,
  -- Which columns actually changed (UPDATE only)
  changed_fields TEXT[],
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.audit_log IS
  'Append-only audit trail for sensitive actions. Pruned to 90 days by pg_cron. No client access — service role only.';

-- Never allow any client to read or write audit logs directly
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
-- No policies → RLS blocks all client access; only service role bypasses RLS

-- Fast time-range queries for the admin panel audit view
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
  ON public.audit_log (created_at DESC);

-- Filter by who changed what
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by
  ON public.audit_log (changed_by, created_at DESC)
  WHERE changed_by IS NOT NULL;

-- Filter by table + record (see full history of one user or gromada)
CREATE INDEX IF NOT EXISTS idx_audit_log_record
  ON public.audit_log (table_name, record_id, created_at DESC);

-- ==========================================
-- TRIGGER FUNCTION
--
-- Attached to tables below. Captures:
--  - old/new row data as JSONB
--  - current user from JWT claims
--  - which columns changed (UPDATE)
--
-- SECURITY NOTE: We strip push_token_enc and
-- contact_email_enc from the JSONB before
-- writing to audit_log to avoid storing
-- encrypted blobs twice.
-- ==========================================

CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id   UUID;
  v_old_data  JSONB;
  v_new_data  JSONB;
  v_changed   TEXT[];
  v_key       TEXT;
BEGIN
  -- Extract caller's user_id from JWT claims (available inside RLS context)
  BEGIN
    v_user_id := (current_setting('request.jwt.claims', true)::JSONB ->> 'sub')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL; -- cron jobs, triggers without user context
  END;

  -- Build JSONB snapshots, stripping encrypted binary columns
  IF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD) - 'push_token_enc' - 'contact_email_enc';
    v_new_data := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW) - 'push_token_enc' - 'contact_email_enc';
  ELSE -- UPDATE
    v_old_data := to_jsonb(OLD) - 'push_token_enc' - 'contact_email_enc';
    v_new_data := to_jsonb(NEW) - 'push_token_enc' - 'contact_email_enc';
    -- Collect only the changed keys
    v_changed := ARRAY[]::TEXT[];
    FOR v_key IN SELECT key FROM jsonb_each(v_old_data) LOOP
      IF v_old_data -> v_key IS DISTINCT FROM v_new_data -> v_key THEN
        v_changed := v_changed || v_key;
      END IF;
    END LOOP;
  END IF;

  INSERT INTO public.audit_log (
    table_name, record_id, action,
    changed_by, old_data, new_data, changed_fields
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(
      (CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ->> 'id' ELSE to_jsonb(NEW) ->> 'id' END)::UUID,
      gen_random_uuid()
    ),
    TG_OP,
    v_user_id,
    v_old_data,
    v_new_data,
    v_changed
  );

  RETURN NULL; -- AFTER trigger; return value is ignored
END;
$$;

-- ==========================================
-- ATTACH TRIGGERS
--
-- Only on tables where we need a tamper-evident
-- record: membership changes, bans, admin grants.
-- NOT on high-volume tables (posts, messages)
-- to avoid performance impact.
-- ==========================================

-- gromada_members: join / leave / role change
CREATE OR REPLACE TRIGGER audit_gromada_members
  AFTER INSERT OR UPDATE OR DELETE ON public.gromada_members
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- profiles: is_banned changes, age_group update
CREATE OR REPLACE TRIGGER audit_profiles
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  -- Only audit when something important changes, not every last_active_at update
  WHEN (
    OLD.is_banned IS DISTINCT FROM NEW.is_banned OR
    OLD.onboarding_completed IS DISTINCT FROM NEW.onboarding_completed
  )
  EXECUTE FUNCTION audit_trigger();

-- gromady: status changes (active → dormant → archived)
CREATE OR REPLACE TRIGGER audit_gromady_status
  AFTER UPDATE ON public.gromady
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.elder_id IS DISTINCT FROM NEW.elder_id)
  EXECUTE FUNCTION audit_trigger();

-- admin_users: grant and revoke
CREATE OR REPLACE TRIGGER audit_admin_users
  AFTER INSERT OR UPDATE OR DELETE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- reports: resolution (status changes)
CREATE OR REPLACE TRIGGER audit_reports
  AFTER UPDATE ON public.reports
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION audit_trigger();

-- ==========================================
-- RETENTION: 90-day pg_cron job
--
-- Requires the pg_cron extension (enabled by
-- default on Supabase). Runs at 03:00 UTC daily.
-- ==========================================

SELECT cron.schedule(
  'audit-log-prune',           -- job name (idempotent)
  '0 3 * * *',                 -- daily at 03:00 UTC
  $$
    DELETE FROM public.audit_log
     WHERE created_at < NOW() - INTERVAL '90 days';
  $$
);

COMMENT ON FUNCTION audit_trigger IS
  'Generic AFTER trigger that writes a row to audit_log. Strips encrypted columns before logging.';
