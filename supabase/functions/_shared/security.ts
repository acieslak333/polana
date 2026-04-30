/**
 * Shared security utilities for all Edge Functions.
 *
 * Usage:
 *   import { requireAuth, requireAdmin, checkRateLimit, requestId } from '../_shared/security.ts'
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { AdminRole } from '../../../packages/db-types/src/tables.ts'

// ─── Request ID ───────────────────────────────────────────────────────────────

/**
 * Returns the X-Request-ID header from the incoming request, or generates
 * a new UUID. Attach to all responses for audit log correlation.
 */
export function requestId(req: Request): string {
  return req.headers.get('x-request-id') ?? crypto.randomUUID()
}

// ─── Auth validation ──────────────────────────────────────────────────────────

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; response: Response }

/**
 * Validates the JWT Bearer token in the Authorization header.
 * Returns the authenticated user's ID or a 401 Response.
 *
 * Uses Supabase's built-in JWT verification — does NOT accept
 * service role key as a user token.
 */
export async function requireAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      ok: false,
      response: json({ error: 'Unauthorized' }, 401),
    }
  }

  const jwt = authHeader.slice(7)

  // Create a user-scoped client (validates JWT, not service role)
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    }
  )

  const { data: { user }, error } = await userClient.auth.getUser()

  if (error || !user) {
    return {
      ok: false,
      response: json({ error: 'Unauthorized' }, 401),
    }
  }

  return { ok: true, userId: user.id }
}

// ─── Admin role check ─────────────────────────────────────────────────────────

export type AdminResult =
  | { ok: true; userId: string; role: AdminRole }
  | { ok: false; response: Response }

/**
 * Verifies the caller is in admin_users with at least the required role.
 * Requires a valid JWT (calls requireAuth internally).
 *
 * Role hierarchy: super_admin > moderator > content_editor
 */
export async function requireAdmin(
  req: Request,
  adminClient: SupabaseClient,
  minRole: AdminRole = 'content_editor',
): Promise<AdminResult> {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth

  const { data, error } = await adminClient
    .from('admin_users')
    .select('role')
    .eq('user_id', auth.userId)
    .is('revoked_at', null)
    .single()

  if (error || !data) {
    return {
      ok: false,
      response: json({ error: 'Forbidden — not an admin' }, 403),
    }
  }

  const roleOrder: AdminRole[] = ['content_editor', 'moderator', 'super_admin']
  const callerLevel = roleOrder.indexOf(data.role as AdminRole)
  const requiredLevel = roleOrder.indexOf(minRole)

  if (callerLevel < requiredLevel) {
    return {
      ok: false,
      response: json({ error: `Forbidden — requires ${minRole}` }, 403),
    }
  }

  return { ok: true, userId: auth.userId, role: data.role as AdminRole }
}

// ─── Rate limiting ────────────────────────────────────────────────────────────

const RATE_LIMITS: Record<string, { maxRequests: number; windowSeconds: number }> = {
  'send-notification':  { maxRequests: 10,  windowSeconds: 60 },
  'create-invite':      { maxRequests: 5,   windowSeconds: 60 },
  'admin-ban-user':     { maxRequests: 20,  windowSeconds: 60 },
  'admin-grant-access': { maxRequests: 10,  windowSeconds: 60 },
  default:              { maxRequests: 60,  windowSeconds: 60 },
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; response: Response }

/**
 * Sliding window rate limiter backed by api_rate_limits table.
 * Returns ok:false with 429 response if the user is over their limit.
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  adminClient: SupabaseClient,
): Promise<RateLimitResult> {
  const limit = RATE_LIMITS[endpoint] ?? RATE_LIMITS['default']
  const windowStart = new Date(
    Math.floor(Date.now() / (limit.windowSeconds * 1000)) * (limit.windowSeconds * 1000)
  ).toISOString()

  // Upsert: increment counter for this user+endpoint+window
  const { data, error } = await adminClient.rpc('increment_rate_limit', {
    p_user_id: userId,
    p_endpoint: endpoint,
    p_window_start: windowStart,
  })

  if (error) {
    // If rate limit table is unavailable, fail open (don't block the request)
    console.error('Rate limit check failed:', error.message)
    return { ok: true }
  }

  const count = (data as number) ?? 1

  if (count > limit.maxRequests) {
    return {
      ok: false,
      response: json(
        { error: 'Too many requests', retryAfter: limit.windowSeconds },
        429,
        { 'Retry-After': String(limit.windowSeconds) },
      ),
    }
  }

  return { ok: true }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function json(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  })
}
