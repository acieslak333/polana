-- ==========================================
-- ENCRYPTION & PII REDUCTION
-- Sprint 21: eliminate unnecessary PII storage
-- and encrypt sensitive columns that must be kept.
-- ==========================================

-- ==========================================
-- EXTENSION
-- ==========================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- STEP 1: Replace date_of_birth with age_group
--
-- WHY: date_of_birth is precise PII that we do
-- not need after the ≥16 check at registration.
-- Storing it long-term is a GDPR liability.
-- We convert existing DOBs to age buckets and
-- drop the column.
--
-- Age groups match industry-standard analytics
-- buckets; the app only uses this for optional
-- display in the admin panel.
-- ==========================================

-- Add the new column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age_group TEXT
    CHECK (age_group IN ('under_18', '18_24', '25_34', '35_44', '45_54', '55_plus'));

-- Back-fill from existing DOB values
UPDATE public.profiles
   SET age_group = CASE
     WHEN date_of_birth IS NULL                          THEN NULL
     WHEN date_of_birth > CURRENT_DATE - INTERVAL '18 years' THEN 'under_18'
     WHEN date_of_birth > CURRENT_DATE - INTERVAL '25 years' THEN '18_24'
     WHEN date_of_birth > CURRENT_DATE - INTERVAL '35 years' THEN '25_34'
     WHEN date_of_birth > CURRENT_DATE - INTERVAL '45 years' THEN '35_44'
     WHEN date_of_birth > CURRENT_DATE - INTERVAL '55 years' THEN '45_54'
     ELSE '55_plus'
   END
 WHERE date_of_birth IS NOT NULL;

-- Drop the precise DOB column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS date_of_birth;

COMMENT ON COLUMN public.profiles.age_group IS
  'Age range bucket derived from DOB at registration time. Precise DOB is never stored.';

-- ==========================================
-- STEP 2: Encrypt push_token
--
-- WHY: push tokens are device-level credentials.
-- Leaking them allows sending arbitrary push
-- notifications to any user device. We encrypt
-- with pgcrypto symmetric encryption.
--
-- KEY MANAGEMENT:
--   The encryption key is stored in Supabase Vault
--   (a Postgres secret) and loaded via:
--     current_setting('app.push_token_key')
--   Set this in Supabase → Settings → Vault, then:
--     ALTER DATABASE postgres SET app.push_token_key = '<secret>';
--
-- CLIENT BEHAVIOUR:
--   - The app WRITES tokens → Edge Function (write-only)
--   - The app NEVER reads push_token back
--   - send-notification Edge Function decrypts server-side
--   - Dashboard shows only "[encrypted]" for this column
-- ==========================================

-- Add encrypted column alongside existing push_token
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_token_enc BYTEA;

-- Migrate existing plaintext tokens to encrypted form
-- (runs only if the setting exists; safe to run before Vault is configured)
DO $$
BEGIN
  IF current_setting('app.push_token_key', true) IS NOT NULL
     AND current_setting('app.push_token_key', true) != '' THEN
    UPDATE public.profiles
       SET push_token_enc = pgp_sym_encrypt(push_token, current_setting('app.push_token_key'))
     WHERE push_token IS NOT NULL AND push_token_enc IS NULL;
  END IF;
END;
$$;

-- Drop the plaintext column
-- NOTE: only drop AFTER confirming Vault key is set and migration succeeded.
-- Run this separately in production:
--   ALTER TABLE public.profiles DROP COLUMN push_token;
--   ALTER TABLE public.profiles DROP COLUMN push_token_updated_at;
-- We leave a comment rather than executing here to avoid data loss if
-- the Vault key is not yet configured.

COMMENT ON COLUMN public.profiles.push_token_enc IS
  'Push notification token, encrypted with pgp_sym_encrypt using app.push_token_key from Supabase Vault. Decrypt only in Edge Functions using pgp_sym_decrypt.';

COMMENT ON COLUMN public.profiles.push_token IS
  'DEPRECATED: plaintext push token. Migrate to push_token_enc then run: ALTER TABLE profiles DROP COLUMN push_token;';

-- ==========================================
-- STEP 3: Encrypt contact_email in gromada_allies
--
-- WHY: ally contact emails are third-party PII
-- that should not be readable via the Supabase
-- dashboard or client API by any gromada member.
-- Only admins (service role) and the elder need it.
-- ==========================================

ALTER TABLE public.gromada_allies
  ADD COLUMN IF NOT EXISTS contact_email_enc BYTEA;

DO $$
BEGIN
  IF current_setting('app.push_token_key', true) IS NOT NULL
     AND current_setting('app.push_token_key', true) != '' THEN
    UPDATE public.gromada_allies
       SET contact_email_enc = pgp_sym_encrypt(contact_email, current_setting('app.push_token_key'))
     WHERE contact_email IS NOT NULL AND contact_email_enc IS NULL;
  END IF;
END;
$$;

COMMENT ON COLUMN public.gromada_allies.contact_email_enc IS
  'Ally contact email encrypted with pgp_sym_encrypt. Same key as push_token_enc. Decrypt only in Edge Functions.';

COMMENT ON COLUMN public.gromada_allies.contact_email IS
  'DEPRECATED: plaintext contact email. Migrate to contact_email_enc then drop this column.';

-- ==========================================
-- HELPER: decrypt function for Edge Functions
--
-- Usage (in Edge Function, via service role):
--   SELECT decrypt_field(push_token_enc) FROM profiles WHERE id = $1;
-- ==========================================

CREATE OR REPLACE FUNCTION decrypt_field(encrypted BYTEA)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER  -- runs as table owner, not caller
AS $$
BEGIN
  -- Only service role can call this function.
  -- SECURITY DEFINER + no GRANT = only superuser + service role.
  RETURN pgp_sym_decrypt(
    encrypted,
    current_setting('app.push_token_key')
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Never surface decryption errors to clients
    RETURN NULL;
END;
$$;

-- Explicitly revoke from public and authenticated
REVOKE ALL ON FUNCTION decrypt_field(BYTEA) FROM PUBLIC;
REVOKE ALL ON FUNCTION decrypt_field(BYTEA) FROM authenticated;

COMMENT ON FUNCTION decrypt_field IS
  'Decrypt a pgp_sym_encrypt column. Service role only — not callable by authenticated clients.';
