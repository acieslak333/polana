-- Structured logs table for Edge Function observability.
-- Rows are auto-purged after 30 days via pg_cron (configured in supabase config.toml).

CREATE TABLE public.app_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  event TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  duration_ms INT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_msg TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only the service role can write logs; nobody reads them from the client
ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client access to logs" ON public.app_logs
  FOR ALL USING (false);

-- Index for querying recent logs by function
CREATE INDEX app_logs_function_name_idx ON public.app_logs (function_name, created_at DESC);
CREATE INDEX app_logs_created_at_idx ON public.app_logs (created_at DESC);
