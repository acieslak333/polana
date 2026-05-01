-- supabase/migrations/019b_name_word_unique_constraints.sql
-- ==========================================
-- Add unique constraints to name word tables
-- so ON CONFLICT DO NOTHING works correctly
-- and the admin panel cannot create duplicates.
-- ==========================================

ALTER TABLE public.name_adjectives
  ADD CONSTRAINT IF NOT EXISTS uq_adj_word_lang UNIQUE (word_pl, language);

ALTER TABLE public.name_animals
  ADD CONSTRAINT IF NOT EXISTS uq_ani_word_lang UNIQUE (word_pl, language);

ALTER TABLE public.name_suffixes
  ADD CONSTRAINT IF NOT EXISTS uq_suf_word_lang UNIQUE (word_pl, language);
