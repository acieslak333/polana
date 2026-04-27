// Structured logger for Edge Functions.
// Writes one row to app_logs per function invocation.
// Usage:
//   const log = makeLogger(supabase, 'function-name');
//   const done = log.start('event-name', { userId });
//   // ... do work ...
//   await done(true);           // success
//   await done(false, err.msg); // failure

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface LogEntry {
  function_name: string;
  event: string;
  user_id?: string | null;
  duration_ms?: number;
  success: boolean;
  error_msg?: string | null;
  metadata?: Record<string, unknown>;
}

export function makeLogger(supabase: SupabaseClient, functionName: string) {
  function start(
    event: string,
    opts: { userId?: string | null; metadata?: Record<string, unknown> } = {},
  ) {
    const startedAt = Date.now();

    return async (success: boolean, errorMsg?: string) => {
      const entry: LogEntry = {
        function_name: functionName,
        event,
        user_id: opts.userId ?? null,
        duration_ms: Date.now() - startedAt,
        success,
        error_msg: errorMsg ?? null,
        metadata: opts.metadata ?? {},
      };

      // Fire-and-forget — log failures silently to avoid masking real errors
      await supabase.from('app_logs').insert(entry).then(({ error }) => {
        if (error) console.error('[logger] failed to write log:', error.message);
      });
    };
  }

  return { start };
}
