-- ==========================================
-- ROW LEVEL SECURITY — all tables
-- ==========================================

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_any" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- USER_INTERESTS
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_interests_select_own" ON public.user_interests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_interests_insert_own" ON public.user_interests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_interests_delete_own" ON public.user_interests
  FOR DELETE USING (auth.uid() = user_id);

-- CITIES (public read)
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cities_select_active" ON public.cities
  FOR SELECT USING (is_active = true);

-- INTERESTS (public read)
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interests_select_all" ON public.interests
  FOR SELECT USING (true);

-- GROMADY
ALTER TABLE public.gromady ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gromady_select_active" ON public.gromady
  FOR SELECT USING (status = 'active');

CREATE POLICY "gromady_insert_authenticated" ON public.gromady
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "gromady_update_elder" ON public.gromady
  FOR UPDATE USING (elder_id = auth.uid());

-- GROMADA_INTERESTS
ALTER TABLE public.gromada_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gromada_interests_select_all" ON public.gromada_interests
  FOR SELECT USING (true);

CREATE POLICY "gromada_interests_insert_elder" ON public.gromada_interests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gromady
      WHERE id = gromada_id AND elder_id = auth.uid()
    )
  );

-- GROMADA_MEMBERS
ALTER TABLE public.gromada_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gromada_members_select_member" ON public.gromada_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gromada_members gm
      WHERE gm.gromada_id = gromada_members.gromada_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "gromada_members_insert_self" ON public.gromada_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "gromada_members_delete_self_or_elder" ON public.gromada_members
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.gromady
      WHERE id = gromada_id AND elder_id = auth.uid()
    )
  );

-- EVENTS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_member_or_public" ON public.events
  FOR SELECT USING (
    is_public = true OR
    gromada_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.gromada_members
      WHERE gromada_id = events.gromada_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "events_insert_member" ON public.events
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND (
      gromada_id IS NULL OR
      EXISTS (
        SELECT 1 FROM public.gromada_members
        WHERE gromada_id = events.gromada_id AND user_id = auth.uid()
      )
    )
  );

CREATE POLICY "events_update_creator_or_elder" ON public.events
  FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.gromady
      WHERE id = events.gromada_id AND elder_id = auth.uid()
    )
  );

-- EVENT_RSVPS
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_rsvps_select_member" ON public.event_rsvps
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.gromada_members gm ON gm.gromada_id = e.gromada_id
      WHERE e.id = event_rsvps.event_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "event_rsvps_insert_own" ON public.event_rsvps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "event_rsvps_update_own" ON public.event_rsvps
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "event_rsvps_delete_own" ON public.event_rsvps
  FOR DELETE USING (auth.uid() = user_id);

-- POSTS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select_member" ON public.posts
  FOR SELECT USING (
    is_hidden = false AND
    EXISTS (
      SELECT 1 FROM public.gromada_members
      WHERE gromada_id = posts.gromada_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "posts_insert_member" ON public.posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.gromada_members
      WHERE gromada_id = posts.gromada_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "posts_update_own" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "posts_delete_own_or_elder" ON public.posts
  FOR DELETE USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM public.gromady
      WHERE id = posts.gromada_id AND elder_id = auth.uid()
    )
  );

-- COMMENTS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_post_member" ON public.comments
  FOR SELECT USING (
    is_hidden = false AND
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.gromada_members gm ON gm.gromada_id = p.gromada_id
      WHERE p.id = comments.post_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "comments_insert_member" ON public.comments
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.gromada_members gm ON gm.gromada_id = p.gromada_id
      WHERE p.id = comments.post_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "comments_delete_own_or_elder" ON public.comments
  FOR DELETE USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.gromady g ON g.id = p.gromada_id
      WHERE p.id = comments.post_id AND g.elder_id = auth.uid()
    )
  );

-- REACTIONS
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reactions_select_member" ON public.reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      JOIN public.gromada_members gm ON gm.gromada_id = p.gromada_id
      WHERE p.id = reactions.post_id AND gm.user_id = auth.uid()
    ) OR reactions.post_id IS NULL
  );

CREATE POLICY "reactions_insert_own" ON public.reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reactions_delete_own" ON public.reactions
  FOR DELETE USING (auth.uid() = user_id);

-- FAVOR_REQUESTS
ALTER TABLE public.favor_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favor_requests_select_member" ON public.favor_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gromada_members
      WHERE gromada_id = favor_requests.gromada_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "favor_requests_insert_member" ON public.favor_requests
  FOR INSERT WITH CHECK (
    auth.uid() = requested_by AND
    EXISTS (
      SELECT 1 FROM public.gromada_members
      WHERE gromada_id = favor_requests.gromada_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "favor_requests_update_own" ON public.favor_requests
  FOR UPDATE USING (auth.uid() = requested_by);

-- FAVOR_OFFERS
ALTER TABLE public.favor_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favor_offers_select_member" ON public.favor_offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.favor_requests fr
      JOIN public.gromada_members gm ON gm.gromada_id = fr.gromada_id
      WHERE fr.id = favor_offers.favor_request_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "favor_offers_insert_member" ON public.favor_offers
  FOR INSERT WITH CHECK (
    auth.uid() = offered_by AND
    EXISTS (
      SELECT 1 FROM public.favor_requests fr
      JOIN public.gromada_members gm ON gm.gromada_id = fr.gromada_id
      WHERE fr.id = favor_offers.favor_request_id AND gm.user_id = auth.uid()
    )
  );

-- CROSSOVER_PROPOSALS
ALTER TABLE public.crossover_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crossovers_select_member" ON public.crossover_proposals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gromada_members
      WHERE (gromada_id = from_gromada_id OR gromada_id = to_gromada_id)
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "crossovers_insert_member" ON public.crossover_proposals
  FOR INSERT WITH CHECK (
    auth.uid() = proposed_by AND
    EXISTS (
      SELECT 1 FROM public.gromada_members
      WHERE gromada_id = from_gromada_id AND user_id = auth.uid()
    )
  );

-- MESSAGES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = messages.chat_room_id AND (
        (cr.type = 'gromada' AND EXISTS (
          SELECT 1 FROM public.gromada_members
          WHERE gromada_id = cr.gromada_id AND user_id = auth.uid()
        )) OR
        (cr.type = 'event' AND EXISTS (
          SELECT 1 FROM public.event_rsvps
          WHERE event_id = cr.event_id AND user_id = auth.uid() AND status = 'going'
        )) OR
        (cr.type = 'direct' AND (cr.participant_1 = auth.uid() OR cr.participant_2 = auth.uid()))
      )
    )
  );

CREATE POLICY "messages_insert_participant" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = chat_room_id AND (
        (cr.type = 'gromada' AND EXISTS (
          SELECT 1 FROM public.gromada_members
          WHERE gromada_id = cr.gromada_id AND user_id = auth.uid()
        )) OR
        (cr.type = 'event' AND EXISTS (
          SELECT 1 FROM public.event_rsvps
          WHERE event_id = cr.event_id AND user_id = auth.uid() AND status = 'going'
        )) OR
        (cr.type = 'direct' AND (cr.participant_1 = auth.uid() OR cr.participant_2 = auth.uid()))
      )
    )
  );

CREATE POLICY "messages_delete_own" ON public.messages
  FOR DELETE USING (auth.uid() = sender_id);

-- CHAT_ROOMS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_rooms_select_participant" ON public.chat_rooms
  FOR SELECT USING (
    (type = 'gromada' AND EXISTS (
      SELECT 1 FROM public.gromada_members
      WHERE gromada_id = chat_rooms.gromada_id AND user_id = auth.uid()
    )) OR
    (type = 'event' AND EXISTS (
      SELECT 1 FROM public.event_rsvps
      WHERE event_id = chat_rooms.event_id AND user_id = auth.uid()
    )) OR
    (type = 'direct' AND (participant_1 = auth.uid() OR participant_2 = auth.uid()))
  );

CREATE POLICY "chat_rooms_insert_authenticated" ON public.chat_rooms
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- CHAT_MUTES
ALTER TABLE public.chat_mutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_mutes_select_own" ON public.chat_mutes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "chat_mutes_insert_own" ON public.chat_mutes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_mutes_update_own" ON public.chat_mutes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "chat_mutes_delete_own" ON public.chat_mutes
  FOR DELETE USING (auth.uid() = user_id);

-- FRIENDSHIPS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friendships_select_participant" ON public.friendships
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "friendships_insert_own" ON public.friendships
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "friendships_update_addressee" ON public.friendships
  FOR UPDATE USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

-- GROMADA_ALLIES (public read)
ALTER TABLE public.gromada_allies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allies_select_member" ON public.gromada_allies
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.gromada_members
      WHERE gromada_id = gromada_allies.gromada_id AND user_id = auth.uid()
    )
  );

-- REPORTS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_insert_own" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports_select_own" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- NAME TABLES (public read, no write from client)
ALTER TABLE public.name_adjectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "name_adjectives_select" ON public.name_adjectives FOR SELECT USING (true);

ALTER TABLE public.name_animals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "name_animals_select" ON public.name_animals FOR SELECT USING (true);

ALTER TABLE public.name_suffixes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "name_suffixes_select" ON public.name_suffixes FOR SELECT USING (true);
