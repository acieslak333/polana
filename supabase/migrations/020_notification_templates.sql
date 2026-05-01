-- supabase/migrations/020_notification_templates.sql
CREATE TABLE IF NOT EXISTS public.notification_templates (
  type     TEXT NOT NULL,
  language TEXT NOT NULL,
  title    TEXT NOT NULL,
  body     TEXT NOT NULL,
  PRIMARY KEY (type, language)
);

COMMENT ON TABLE public.notification_templates IS
  'Push notification copy per type and language. {variable} tokens interpolated in send-notification Edge Function. Admin panel manages via service role only.';

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

INSERT INTO public.notification_templates (type, language, title, body) VALUES
  ('new_message',   'pl', 'Nowa wiadomość w {gromada}',   '{sender} napisał(a) do grupy'),
  ('new_event',     'pl', 'Nowe wydarzenie: {title}',      '{gromada} organizuje spotkanie'),
  ('rsvp_reminder', 'pl', 'Przypomnienie: {title}',        'Wydarzenie zaczyna się jutro'),
  ('favor_offer',   'pl', 'Ktoś oferuje pomoc',             '{sender} chce pomóc z: {favor}'),
  ('invite',        'pl', 'Zaproszenie do {gromada}',      '{sender} zaprasza cię do grupy'),
  ('new_message',   'en', 'New message in {gromada}',      '{sender} sent a message'),
  ('new_event',     'en', 'New event: {title}',             '{gromada} is organising a meetup'),
  ('rsvp_reminder', 'en', 'Reminder: {title}',              'Your event starts tomorrow'),
  ('favor_offer',   'en', 'Someone offered help',            '{sender} wants to help with: {favor}'),
  ('invite',        'en', 'Invitation to {gromada}',        '{sender} invited you to join'),
  ('new_message',   'uk', 'Нове повідомлення в {gromada}', '{sender} написав(ла) у групу'),
  ('new_event',     'uk', 'Нова подія: {title}',            '{gromada} організовує зустріч'),
  ('rsvp_reminder', 'uk', 'Нагадування: {title}',           'Подія починається завтра'),
  ('favor_offer',   'uk', 'Хтось пропонує допомогу',        '{sender} хоче допомогти з: {favor}'),
  ('invite',        'uk', 'Запрошення до {gromada}',        '{sender} запрошує вас до групи')
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_notification_templates_lookup
  ON public.notification_templates (type, language);
