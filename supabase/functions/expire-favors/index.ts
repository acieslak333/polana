import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (_req) => {
  const { data, error } = await supabase
    .from('favor_requests')
    .update({ status: 'expired' })
    .eq('status', 'open')
    .lt('expires_at', new Date().toISOString())
    .select('id');

  if (error) return new Response(error.message, { status: 500 });

  return new Response(
    JSON.stringify({ expired: data?.length ?? 0 }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
