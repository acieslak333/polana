-- ==========================================
-- DECRYPTION HELPER FUNCTIONS
-- Used only by Edge Functions via service role.
-- All functions are SECURITY DEFINER and
-- explicitly revoked from public/authenticated.
-- ==========================================

-- Returns the decrypted push token for a specific user.
-- Only callable with service role (for send-notification function).
CREATE OR REPLACE FUNCTION decrypt_field_for_user(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT pgp_sym_decrypt(
      push_token_enc,
      current_setting('app.push_token_key')
    )
    FROM public.profiles
    WHERE id = p_user_id
      AND push_token_enc IS NOT NULL
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Never surface decryption errors; let the caller fall back to plaintext
    RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION decrypt_field_for_user(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION decrypt_field_for_user(UUID) FROM authenticated;

COMMENT ON FUNCTION decrypt_field_for_user IS
  'Returns decrypted push token for one user. Service role only — not callable by clients.';
