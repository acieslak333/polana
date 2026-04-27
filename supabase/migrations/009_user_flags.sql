-- User flags for moderation (is_banned added in Sprint 18).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;

-- Banned users cannot read or write any content
CREATE POLICY "Banned users blocked from posts" ON public.posts
  FOR ALL USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_banned = true
    )
  );

CREATE POLICY "Banned users blocked from messages" ON public.messages
  FOR ALL USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_banned = true
    )
  );
