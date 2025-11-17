-- 1. Enable RLS on all relevant tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_definitions ENABLE ROW LEVEL SECURITY;

-- 2. Policies for `profiles`
CREATE POLICY "Players can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Players can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 3. Policies for `players`
CREATE POLICY "Players can view their own player data" ON public.players FOR SELECT USING (auth.uid() = id);

-- 4. Policies for `resources`
CREATE POLICY "Players can view their own resources" ON public.resources FOR SELECT USING (auth.uid() = player_id);

-- 5. Policies for `player_buildings`
CREATE POLICY "Players can view their own buildings" ON public.player_buildings FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "Players can insert their own buildings" ON public.player_buildings FOR INSERT WITH CHECK (auth.uid() = player_id);

-- 6. Policies for `player_stats`
CREATE POLICY "Players can view their own stats" ON public.player_stats FOR SELECT USING (auth.uid() = id);

-- 7. Public tables (all authenticated users can read)
CREATE POLICY "Authenticated users can view building types" ON public.building_types FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view resource definitions" ON public.resource_definitions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view guilds" ON public.guilds FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view guild members" ON public.guild_members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view planets" ON public.planets FOR SELECT USING (auth.role() = 'authenticated');


-- 8. Admin access (Admins/Moderators can bypass RLS)
-- Note: Supabase admins bypass RLS by default. These policies are for application-level admins.
CREATE POLICY "Admins can access all profiles" ON public.profiles FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'moderator')
);
CREATE POLICY "Admins can access all player data" ON public.players FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'moderator')
);
CREATE POLICY "Admins can access all planets" ON public.planets FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'moderator')
);
CREATE POLICY "Admins can access all resources" ON public.resources FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'moderator')
);
CREATE POLICY "Admins can access all building types" ON public.building_types FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'moderator')
);
CREATE POLICY "Admins can access all player buildings" ON public.player_buildings FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'moderator')
);
CREATE POLICY "Admins can access all guilds" ON public.guilds FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'moderator')
);
CREATE POLICY "Admins can access all guild members" ON public.guild_members FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'moderator')
);
CREATE POLICY "Admins can access all player stats" ON public.player_stats FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'moderator')
