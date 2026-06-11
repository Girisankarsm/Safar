-- Safar: Row Level Security policies

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_waiting_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Public read for reference data
CREATE POLICY "cities_public_read" ON public.cities FOR SELECT USING (true);
CREATE POLICY "zones_public_read" ON public.safety_zones FOR SELECT USING (true);
CREATE POLICY "spots_public_read" ON public.safe_waiting_spots FOR SELECT USING (true);

-- Users
CREATE POLICY "users_read_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_public_profile" ON public.users FOR SELECT USING (true);

-- Safety reports
CREATE POLICY "reports_public_read" ON public.safety_reports FOR SELECT USING (true);
CREATE POLICY "reports_insert_auth" ON public.safety_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reports_update_own" ON public.safety_reports FOR UPDATE USING (auth.uid() = user_id);

-- Votes
CREATE POLICY "votes_public_read" ON public.report_votes FOR SELECT USING (true);
CREATE POLICY "votes_insert_auth" ON public.report_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Comments
CREATE POLICY "comments_public_read" ON public.community_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_auth" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Routes
CREATE POLICY "routes_read_own" ON public.routes FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "routes_insert_auth" ON public.routes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trips
CREATE POLICY "trips_read_own" ON public.trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "trips_read_shared" ON public.trips FOR SELECT USING (share_token IS NOT NULL);
CREATE POLICY "trips_insert_auth" ON public.trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trips_update_own" ON public.trips FOR UPDATE USING (auth.uid() = user_id);

-- Emergency contacts
CREATE POLICY "contacts_read_own" ON public.emergency_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "contacts_insert_own" ON public.emergency_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contacts_update_own" ON public.emergency_contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "contacts_delete_own" ON public.emergency_contacts FOR DELETE USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "notifications_read_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Badges
CREATE POLICY "badges_read_own" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "badges_public_read" ON public.user_badges FOR SELECT USING (true);
