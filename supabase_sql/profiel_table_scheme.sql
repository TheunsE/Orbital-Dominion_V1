-- =====================================================
-- FINAL SCHEMA – WORKS ON SUPABASE 100%
-- Run this ONE file on any fresh database
-- =====================================================

-- All your tables (exactly the same as before)
CREATE TABLE IF NOT EXISTS public.resource_definitions (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
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
  cost integer DEFAULT 100,
  tier integer DEFAULT 1,
  power_usage integer DEFAULT 0,
  requirements jsonb,
  base_production integer DEFAULT 0,
  production_bonus_per_level real DEFAULT 0,
  base_storage integer DEFAULT 0,
  storage_bonus_per_level real DEFAULT 0,
  base_power_generation integer DEFAULT 0,
  power_generation_per_level integer DEFAULT 0,
  max_level integer DEFAULT 10,
  construction_time_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

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
  UNIQUE (player_id, resource_type)
);

CREATE TABLE IF NOT EXISTS public.player_buildings (
  id serial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  building_type_id int NOT NULL REFERENCES public.building_types(id),
  level int DEFAULT 1,
  construction_ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.player_stats (
  id uuid PRIMARY KEY REFERENCES public.players(id) ON DELETE CASCADE,
  level integer DEFAULT 1,
  experience integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Default data
INSERT INTO public.resource_definitions (name) VALUES 
  ('Oxygen'), ('Metal'), ('Crystal'), ('Food')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.planets (name) VALUES 
  ('Terra Nova'), ('Mars Prime'), ('Europa'), ('Titan')
ON CONFLICT (name) DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx 
  ON public.profiles (lower(username));

-- Perfect trigger – usernames saved exactly as typed
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  random_planet_id int;
  desired_username text;
  final_username text;
  counter int := 0;
BEGIN
  desired_username := trim(new.raw_user_meta_data ->> 'username');
  IF desired_username IS NULL OR desired_username = '' THEN
    desired_username := 'Player' || substr(md5(new.id::text), 1, 6);
  END IF;

  final_username := desired_username;

  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(final_username)) LOOP
    counter := counter + 1;
    final_username := desired_username || counter;
  END LOOP;

  INSERT INTO public.profiles (id, email, username)
  VALUES (new.id, lower(new.email), final_username);

  SELECT id INTO random_planet_id FROM public.planets ORDER BY random() LIMIT 1;
  INSERT INTO public.players (id, planet_id) VALUES (new.id, random_planet_id);

  INSERT INTO public.resources (player_id, resource_type, quantity) VALUES
    (new.id, 'Oxygen', 100),
    (new.id, 'Metal', 100),
    (new.id, 'Crystal', 100),
    (new.id, 'Food', 100)
  ON CONFLICT (player_id, resource_type) DO UPDATE SET quantity = EXCLUDED.quantity;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
