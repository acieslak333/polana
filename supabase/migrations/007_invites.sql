CREATE TABLE public.gromada_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gromada_id UUID NOT NULL REFERENCES public.gromady(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  used_by UUID REFERENCES public.profiles(id),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.gromada_invites ENABLE ROW LEVEL SECURITY;

-- Elders of the gromada can manage invites
CREATE POLICY "Elders manage invites" ON public.gromada_invites
  FOR ALL USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.gromady
      WHERE id = gromada_id AND elder_id = auth.uid()
    )
  );

-- Anyone with a valid code can read a single invite (for join flow)
CREATE POLICY "Read invite by code" ON public.gromada_invites
  FOR SELECT USING (true);
