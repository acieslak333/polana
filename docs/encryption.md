# Polana — Encryption & PII Policy

## What we store and why

| Field | Table | Decision | Reason |
|---|---|---|---|
| `first_name` | profiles | Plaintext | Required for UX; low sensitivity |
| `nickname` | profiles | Plaintext | Chosen by user, public-facing |
| `age_group` | profiles | Plaintext bucket | DOB replaced with range ('18_24' etc.) |
| `push_token_enc` | profiles | **pgcrypto encrypted** | Device credential — leaking allows arbitrary notifications |
| `contact_email` | gromada_allies | **pgcrypto encrypted** | Third-party PII |
| Chat messages | messages | Plaintext in DB | Supabase encrypts at rest (AES-256); E2EE is roadmap |
| Passwords | auth.users | Bcrypt (Supabase-managed) | Never in our schema |

## Encryption implementation

We use `pgcrypto`'s `pgp_sym_encrypt` / `pgp_sym_decrypt` with a symmetric key stored in Supabase Vault.

### Setting the key (run once in production)

```sql
-- In Supabase SQL editor, as postgres superuser:
ALTER DATABASE postgres SET app.push_token_key = '<your-64-char-random-hex>';
```

Generate the key:
```bash
openssl rand -hex 32
```

Store it in Supabase Vault → Database → Secrets as `push_token_key` for reference, but the actual runtime value is the `SET` command above.

### Writing an encrypted token (Edge Function)

```typescript
// In send-notification/index.ts or register-push-token/index.ts
const { error } = await supabase
  .from('profiles')
  .update({
    push_token_enc: supabase.rpc('pgp_sym_encrypt', {
      data: pushToken,
      key: Deno.env.get('PUSH_TOKEN_KEY'),
    }),
    push_token_updated_at: new Date().toISOString(),
  })
  .eq('id', userId);
```

Or via raw SQL in an Edge Function:
```sql
UPDATE profiles
SET push_token_enc = pgp_sym_encrypt($1, current_setting('app.push_token_key'))
WHERE id = $2;
```

### Reading a token (Edge Function only)

```sql
SELECT decrypt_field(push_token_enc) AS token
FROM profiles
WHERE id = $1;
```

`decrypt_field()` is a `SECURITY DEFINER` function that only runs with service role — it is not callable by authenticated clients.

## Key rotation procedure

1. Generate a new key: `openssl rand -hex 32`
2. Re-encrypt all tokens in a transaction:
```sql
BEGIN;
UPDATE profiles
SET push_token_enc = pgp_sym_encrypt(
  pgp_sym_decrypt(push_token_enc, current_setting('app.push_token_key')),
  '<new-key>'
)
WHERE push_token_enc IS NOT NULL;
COMMIT;
```
3. Update the database setting: `ALTER DATABASE postgres SET app.push_token_key = '<new-key>';`
4. Reload the connection pool (restart Edge Functions)
5. Rotate the old key out of Vault secrets

## Age group instead of date of birth

We never store a precise date of birth after the registration check. At registration:
1. The mobile app sends DOB → Edge Function validates age ≥ 16
2. Edge Function derives the age_group bucket and stores only that
3. The precise DOB is discarded immediately — never written to the database

Age group values: `under_18`, `18_24`, `25_34`, `35_44`, `45_54`, `55_plus`

## GDPR obligations

- **Article 5(1)(c) — Data minimisation**: We store age_group not DOB ✓
- **Article 32 — Security**: Sensitive credentials encrypted at rest ✓
- **Article 17 — Right to erasure**: `delete-account` Edge Function hard-deletes profile + cascade ✓
- **Article 20 — Portability**: `export-data` Edge Function returns all user data as JSON ✓

## What we do NOT encrypt (and why)

| Field | Reason not encrypted |
|---|---|
| Chat messages | Supabase encrypts storage volume at rest; E2EE would prevent moderation |
| Post content | Must be readable by RLS-authorized gromada members |
| Profile names | Public-facing, user chose to share |
| Event data | Required for map/feed queries |
