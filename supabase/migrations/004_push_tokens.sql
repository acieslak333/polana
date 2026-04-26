-- Add push token storage to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_token TEXT,
  ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMPTZ;
