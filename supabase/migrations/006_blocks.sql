CREATE TABLE public.user_blocks (
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own blocks" ON public.user_blocks
  FOR ALL USING (auth.uid() = blocker_id);

-- Blocked users cannot see each other's posts
CREATE POLICY "Hide posts from blocked users" ON public.posts
  FOR SELECT USING (
    auth.uid() = author_id OR
    NOT EXISTS (
      SELECT 1 FROM public.user_blocks
      WHERE (blocker_id = auth.uid() AND blocked_id = author_id)
         OR (blocker_id = author_id AND blocked_id = auth.uid())
    )
  );
