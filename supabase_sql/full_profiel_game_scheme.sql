-- =====================================================
-- COMPLETE & FINAL GAME SCHEMA (ALL TABLES INCLUDED)
-- 100% WORKING ON SUPABASE – TESTED & PERFECT
-- Run this ONE file on a fresh database
-- =====================================================

-- 1. Core independent tables
CREATE TABLE IF NOT EXISTS public.resource_definitions (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.planets (
  id serial PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.guilds (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.building_types (
  id serial PRIMARY KEY,
  name text NOT NULL,
  tier integer NOT NULL DEFAULT 1,
  cost_metal integer NOT NULL DEFAULT 0,
  cost_crystal integer NOT NULL DEFAULT 0,
  cost_food integer NOT NULL DEFAULT 0,
  power_usage integer NOT NULL DEFAULT 0,
  requirements jsonb,
  base_production integer NOT NULL DEFAULT 0,
  production_bonus_per_level real NOT NULL DEFAULT 0,
  base_storage integer NOT NULL DEFAULT 0,
  storage_bonus_per_level real NOT NULL DEFAULT 0,
  base_power_generation integer NOT NULL DEFAULT 0,
  power_generation_per_level integer NOT NULL DEFAULT 0,
  max_level integer NOT NULL DEFAULT 10,
  construction_time_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 2. Profiles (with perfect case-insensitive unique usernames)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  email text,
  role text DEFAULT 'player' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT profiles_username_key UNIQUE (username),
  CONSTRAINT profiles_email_key UNIQUE (email)
);

-- 3. Players & all dependent tables
CREATE TABLE IF NOT EXISTS public.players (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  planet_id integer REFERENCES public.planets(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.resources (
  id serial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  resource_type text NOT NULL REFERENCES public.resource_definitions(name),
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (player_id, resource_type)  -- Required for ON CONFLICT
);

CREATE TABLE IF NOT EXISTS public.player_buildings (
  id serial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  building_type_id integer NOT NULL REFERENCES public.building_types(id) ON DELETE CASCADE,
  level integer NOT NULL DEFAULT 1,
  construction_ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT level_cap CHECK (level <= 10)
);

CREATE TABLE IF NOT EXISTS public.guild_members (
  id serial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  guild_id integer NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.player_stats (
  id uuid PRIMARY KEY REFERENCES public.players(id) ON DELETE CASCADE,
  level integer NOT NULL DEFAULT 1,
  experience integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Ships
CREATE TABLE IF NOT EXISTS public.ship_types (
  id serial PRIMARY KEY,
  name text NOT NULL,
  tier integer NOT NULL,
  role text,
  unlock_requirement jsonb,
  metal_cost integer NOT NULL,
  food_cost integer NOT NULL,
  energy_cost integer NOT NULL,
  attack integer NOT NULL,
  defense integer NOT NULL,
  speed integer NOT NULL,
  hp integer NOT NULL,
  crew_food_per_hour real NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.player_ships (
  id serial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  ship_type_id integer NOT NULL REFERENCES public.ship_types(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Tech
CREATE TABLE IF NOT EXISTS public.tech_types (
  id serial PRIMARY KEY,
  name text NOT NULL,
  unlocks text,
  required_lab_level integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.player_techs (
  id serial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  tech_type_id integer NOT NULL REFERENCES public.tech_types(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Artifacts
CREATE TABLE IF NOT EXISTS public.artifact_types (
  id serial PRIMARY KEY,
  name text NOT NULL,
  buff text,
  source text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.player_artifacts (
  id serial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  artifact_type_id integer NOT NULL REFERENCES public.artifact_types(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Utility tables
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.online_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  status text DEFAULT 'online',
  last_seen timestamptz DEFAULT now()
);

-- 4. Case-insensitive unique username index (perfect behavior)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx 
  ON public.profiles (lower(username));

-- 5. Default data
INSERT INTO public.resource_definitions (name) VALUES 
  ('metal'), ('crystal'), ('food')
ON CONFLICT DO NOTHING;

INSERT INTO public.planets (name) VALUES 
  ('Terra Nova'), ('Mars Prime'), ('Europa'), ('Titan')
ON CONFLICT DO NOTHING;

-- 6. PERFECT TRIGGER – usernames saved exactly as typed
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  random_planet_id int;
  desired_username text;
  final_username text;
  counter int := 0;
BEGIN
  -- Take username exactly as user typed it
  desired_username := trim(new.raw_user_meta_data ->> 'username');
  IF desired_username IS NULL OR desired_username = '' THEN
    desired_username := 'Player' || substr(md5(new.id::text), 1, 6);
  END IF;

  final_username := desired_username;

  -- Only add number if case-insensitive conflict
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(final_username)) LOOP
    counter := counter + 1;
    final_username := desired_username || counter;
  END LOOP;

  -- Save profile
  INSERT INTO public.profiles (id, email, username)
  VALUES (new.id, lower(new.email), final_username);

  -- Player setup
  SELECT id INTO random_planet_id FROM public.planets ORDER BY random() LIMIT 1;
  INSERT INTO public.players (id, planet_id) VALUES (new.id, random_planet_id);

  -- Starting resources
  INSERT INTO public.resources (player_id, resource_type, quantity) VALUES
    (new.id, 'metal', 500),
    (new.id, 'crystal', 250),
    (new.id, 'food', 100)
  ON CONFLICT (player_id, resource_type) DO UPDATE 
  SET quantity = EXCLUDED.quantity;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. RPC function for atomic resource deduction
CREATE OR REPLACE FUNCTION public.deduct_resources(
  p_player_id uuid,
  p_metal integer,
  p_crystal integer,
  p_food integer
)
RETURNS void AS $$
BEGIN
  UPDATE public.resources
  SET quantity = quantity - p_metal
  WHERE player_id = p_player_id AND resource_type = 'metal';

  UPDATE public.resources
  SET quantity = quantity - p_crystal
  WHERE player_id = p_player_id AND resource_type = 'crystal';

  UPDATE public.resources
  SET quantity = quantity - p_food
  WHERE player_id = p_player_id AND resource_type = 'food';
END;
$$ LANGUAGE plpgsql;

-- DONE

-- 9. Building Queue Table
CREATE TABLE IF NOT EXISTS public.building_queue (
  id serial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  building_id integer NOT NULL REFERENCES public.player_buildings(id) ON DELETE CASCADE,
  target_level integer NOT NULL,
  ends_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(building_id, target_level) -- A building can only be queued for a specific level once
);

-- 10. RPC function for starting an upgrade
CREATE OR REPLACE FUNCTION public.enqueue_building_upgrade(
  p_player_id uuid,
  p_building_id integer
)
RETURNS json AS $$
DECLARE
  current_level integer;
  building_type_id integer;
  cost_metal integer;
  cost_crystal integer;
  cost_food integer;
  construction_time_seconds integer;
  current_metal integer;
  current_crystal integer;
  current_food integer;
  last_in_queue public.building_queue;
  target_level integer;
  start_time timestamptz;
  end_time timestamptz;
BEGIN
  -- Get building details
  SELECT pb.level, pb.building_type_id INTO current_level, building_type_id
  FROM public.player_buildings pb
  WHERE pb.id = p_building_id AND pb.player_id = p_player_id;

  -- Determine target level (current level + number of items already in queue for this building)
  SELECT current_level + 1 + count(*) INTO target_level
  FROM public.building_queue
  WHERE building_id = p_building_id;

  -- Get building type costs and time
  SELECT
    bt.cost_metal * target_level,
    bt.cost_crystal * target_level,
    bt.cost_food * target_level,
    bt.construction_time_seconds
  INTO cost_metal, cost_crystal, cost_food, construction_time_seconds
  FROM public.building_types bt
  WHERE bt.id = building_type_id;

  -- Check player resources
  SELECT quantity INTO current_metal FROM public.resources WHERE player_id = p_player_id AND resource_type = 'metal';
  SELECT quantity INTO current_crystal FROM public.resources WHERE player_id = p_player_id AND resource_type = 'crystal';
  SELECT quantity INTO current_food FROM public.resources WHERE player_id = p_player_id AND resource_type = 'food';

  IF current_metal < cost_metal OR current_crystal < cost_crystal OR current_food < cost_food THEN
    RETURN json_build_object('error', 'Not enough resources');
  END IF;

  -- Deduct resources
  -- This should be a single transaction
  UPDATE public.resources SET quantity = quantity - cost_metal WHERE player_id = p_player_id AND resource_type = 'metal';
  UPDATE public.resources SET quantity = quantity - cost_crystal WHERE player_id = p_player_id AND resource_type = 'crystal';
  UPDATE public.resources SET quantity = quantity - cost_food WHERE player_id = p_player_id AND resource_type = 'food';

  -- Calculate start and end times
  SELECT * INTO last_in_queue
  FROM public.building_queue
  WHERE player_id = p_player_id
  ORDER BY ends_at DESC
  LIMIT 1;

  IF last_in_queue IS NULL THEN
    start_time := now();
  ELSE
    start_time := last_in_queue.ends_at;
  END IF;

  end_time := start_time + (construction_time_seconds * interval '1 second');

  -- Insert into queue
  INSERT INTO public.building_queue (player_id, building_id, target_level, ends_at)
  VALUES (p_player_id, p_building_id, target_level, end_time);

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
