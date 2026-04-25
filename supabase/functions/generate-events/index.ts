import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const EVENT_TEMPLATES: Record<string, { title: string; type: string; duration_h: number }[]> = {
  outdoor: [
    { title: 'Poranny spacer po parku', type: 'walk', duration_h: 2 },
    { title: 'Piknik w parku', type: 'picnic', duration_h: 3 },
  ],
  social: [
    { title: 'Kawa i pogaduchy', type: 'coffee', duration_h: 2 },
    { title: 'Wieczór gier planszowych', type: 'games', duration_h: 3 },
  ],
  sport: [
    { title: 'Siatkówka plażowa', type: 'sport', duration_h: 2 },
    { title: 'Wspólny bieg', type: 'sport', duration_h: 1 },
  ],
  creative: [
    { title: 'Wspólne gotowanie', type: 'workshop', duration_h: 3 },
    { title: 'Warsztaty rękodzieła', type: 'workshop', duration_h: 2 },
  ],
};

const WEEKLY_EVENTS = [
  { title: 'Niedzielny piknik', type: 'picnic', duration_h: 4 },
  { title: 'Wspólne gotowanie weekendowe', type: 'workshop', duration_h: 3 },
  { title: 'Wycieczka rowerowa', type: 'sport', duration_h: 3 },
  { title: 'Wieczór filmowy', type: 'talk', duration_h: 3 },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(18, 0, 0, 0);
  return d.toISOString();
}

Deno.serve(async (_req) => {
  const isWeekly = new Date().getDay() === 0; // Sunday

  // Find gromady with no upcoming events in next 3 days
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);

  const { data: activeGromady } = await supabase
    .from('gromady')
    .select('id, city_id, elder_id, gromada_interests(interests(category))')
    .eq('status', 'active')
    .not('elder_id', 'is', null);

  if (!activeGromady) return new Response('No gromady', { status: 200 });

  let generated = 0;

  for (const gromada of activeGromady) {
    // Check if already has events soon
    const { count } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('gromada_id', gromada.id)
      .eq('status', 'upcoming')
      .lte('starts_at', threeDaysLater.toISOString());

    if ((count ?? 0) > 0) continue;

    // Pick template based on Gromada interests
    const categories = (gromada.gromada_interests as any[])
      .map((gi: any) => gi.interests?.category)
      .filter(Boolean);
    const category = categories[0] ?? 'social';

    const templates = isWeekly ? WEEKLY_EVENTS : (EVENT_TEMPLATES[category] ?? EVENT_TEMPLATES.social);
    const template = pick(templates);

    const startsAt = daysFromNow(isWeekly ? 5 : Math.floor(Math.random() * 2) + 1);
    const endsAt = new Date(startsAt);
    endsAt.setHours(endsAt.getHours() + template.duration_h);

    await supabase.from('events').insert({
      gromada_id: gromada.id,
      created_by: gromada.elder_id,
      title: template.title,
      location_name: 'Do ustalenia przez Gromadę',
      city_id: gromada.city_id,
      starts_at: startsAt,
      ends_at: endsAt.toISOString(),
      event_type: template.type,
      is_auto_generated: true,
      status: 'upcoming',
    });
    generated++;
  }

  return new Response(JSON.stringify({ generated }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
