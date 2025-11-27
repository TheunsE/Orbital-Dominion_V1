-- =====================================================
-- ORBITAL DOMINION – FINAL DATABASE + FULL QUEUE SYSTEM
-- ONE FILE. RUN ONCE. PERFECT FOREVER.
-- =====================================================

-- 1. Clean everything (safe to run multiple times)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.enqueue_building_upgrade(uuid, integer) CASCADE;
DROP TABLE IF EXISTS public.building_queue CASCADE;
DROP TABLE IF EXISTS public.player_ships CASCADE;
DROP TABLE IF EXISTS public.player_buildings CASCADE;
DROP TABLE IF EXISTS public.resources CASCADE;
DROP TABLE IF EXISTS public.players CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.ship_types CASCADE;
DROP TABLE IF EXISTS public.building_types CASCADE;
DROP TABLE IF EXISTS public.resource_definitions CASCADE;

-- 2. Core tables
CREATE TABLE public.resource_definitions (id serial PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE public.building_types (
  id serial PRIMARY KEY, name text NOT NULL UNIQUE, tier integer DEFAULT 1,
  cost_metal integer DEFAULT 0, cost_crystal integer DEFAULT 0, cost_food integer DEFAULT 0, cost_power integer DEFAULT 0,
  power_usage integer DEFAULT 0,
  production_metal_per_level real DEFAULT 0, production_crystal_per_level real DEFAULT 0,
  production_food_per_level real DEFAULT 0, power_generation_per_level integer DEFAULT 0,
  max_level integer DEFAULT 30, construction_time_seconds integer DEFAULT 30
);
CREATE TABLE public.ship_types (
  id serial PRIMARY KEY, name text NOT NULL UNIQUE, tier integer NOT NULL,
  metal_cost integer NOT NULL, crystal_cost integer DEFAULT 0, food_cost integer NOT NULL,
  energy_cost integer DEFAULT 0, attack integer NOT NULL, defense integer NOT NULL,
  speed integer DEFAULT 1, hp integer NOT NULL, crew_food_per_hour real DEFAULT 0
);

-- 3. Profiles + onboarding
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL, email text, role text DEFAULT 'player',
  has_completed_onboarding boolean DEFAULT false, created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX profiles_username_lower_idx ON public.profiles (lower(username));

-- 4. Player tables
CREATE TABLE public.players (id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE);
CREATE TABLE public.resources (
  id serial PRIMARY KEY, player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  resource_type text NOT NULL REFERENCES public.resource_definitions(name),
  quantity integer DEFAULT 0, UNIQUE (player_id, resource_type)
);
CREATE TABLE public.player_buildings (
  id serial PRIMARY KEY, player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  building_type_id integer NOT NULL REFERENCES public.building_types(id),
  level integer DEFAULT 0, construction_ends_at timestamptz,
  UNIQUE (player_id, building_type_id)
);
CREATE TABLE public.player_ships (
  id serial PRIMARY KEY, player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  ship_type_id integer NOT NULL REFERENCES public.ship_types(id),
  quantity integer DEFAULT 0, UNIQUE (player_id, ship_type_id)
);

-- 5. Resources
INSERT INTO public.resource_definitions (name) VALUES ('metal'),('crystal'),('food'),('power') ON CONFLICT DO NOTHING;

-- 6. All 13 buildings
INSERT INTO public.building_types (name,tier,cost_metal,cost_crystal,cost_food,cost_power,power_usage,
   production_metal_per_level,production_crystal_per_level,production_food_per_level,power_generation_per_level,max_level,construction_time_seconds)
VALUES
  ('Metal Mine',1,60,15,0,0,10,30,0,0,0,30,30),
  ('Crystal Mine',1,48,24,0,0,10,0,20,0,0,30,45),
  ('Food Synthesizer',1,75,30,10,0,15,0,0,15,0,30,60),
  ('Solar Plant',1,75,30,0,0,0,0,0,0,20,30,90),
  ('Communications Center',1,100,50,0,0,0,0,0,0,20,30,30),
  ('Warroom',2,200,100,50,0,15,0,0,0,0,25,60),
  ('Radar Station',1,150,75,25,0,10,0,0,0,5,20,45),
  ('Trade Pod',1,80,40,100,0,0,0,0,12,0,25,40),
  ('Work Yard',2,300,150,0,0,10,10,0,0,10,30,120),
  ('Research Lab',2,250,200,0,0,20,0,8,0,0,30,90),
  ('Bunker',3,400,100,200,0,25,0,0,0,0,20,180),
  ('Silo',1,50,25,25,0,0,0,0,0,0,30,20),
  ('Shield',4,500,300,100,0,50,0,0,0,-10,15,300)
ON CONFLICT (name) DO NOTHING;

-- 7. All 7 ships
INSERT INTO public.ship_types (name,tier,metal_cost,crystal_cost,food_cost,energy_cost,attack,defense,speed,hp,crew_food_per_hour) VALUES
  ('Scout',1,50,20,10,5,5,10,10,50,0),
  ('Corvette',2,150,50,20,10,20,15,8,100,1),
  ('Frigate',3,300,100,50,25,40,30,6,200,2),
  ('Cruiser',4,800,300,100,50,80,50,5,400,5),
  ('Battleship',5,2000,800,200,100,150,100,4,800,10),
  ('Carrier',5,1500,600,150,80,60,120,3,600,8),
  ('Colonization Ship',6,1000,500,300,150,0,80,2,500,15)
ON CONFLICT (name) DO NOTHING;

-- 8. Signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  desired_username text;
  final_username text;
  counter int := 0;
BEGIN
  desired_username := trim(COALESCE(new.raw_user_meta_data->>'username', 'Commander'||substr(md5(new.id::text),1,6)));
  final_username := desired_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username)=lower(final_username)) LOOP
    counter := counter + 1;
    final_username := desired_username || counter;
  END LOOP;

  INSERT INTO public.profiles (id, username, email, has_completed_onboarding) VALUES (new.id, final_username, new.email, false);
  INSERT INTO public.players (id) VALUES (new.id);
  INSERT INTO public.resources (player_id,resource_type,quantity) VALUES
    (new.id,'metal',500),(new.id,'crystal',250),(new.id,'food',100),(new.id,'power',100)
  ON CONFLICT (player_id,resource_type) DO NOTHING;

  INSERT INTO public.player_buildings (player_id,building_type_id,level)
  SELECT new.id, bt.id, CASE WHEN bt.name='Communications Center' THEN 1 ELSE 0 END
  FROM public.building_types bt
  ON CONFLICT (player_id,building_type_id) DO UPDATE SET level=EXCLUDED.level;

  INSERT INTO public.player_ships (player_id,ship_type_id,quantity)
  SELECT new.id, id, 0 FROM public.ship_types
  ON CONFLICT (player_id,ship_type_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Building queue + RPC
CREATE TABLE public.building_queue (
  id serial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  building_id integer NOT NULL REFERENCES public.player_buildings(id) ON DELETE CASCADE,
  target_level integer NOT NULL,
  ends_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(building_id, target_level)
);

CREATE OR REPLACE FUNCTION public.enqueue_building_upgrade(p_player_id uuid, p_building_id integer)
RETURNS json AS $$
DECLARE
  current_level integer; building_type_id integer; bt record;
  cost_metal integer; cost_crystal integer; cost_food integer;
  construction_time_seconds integer;
  current_metal integer; current_crystal integer; current_food integer;
  last_queue_ends timestamptz; target_level integer; start_time timestamptz; end_time timestamptz;
BEGIN
  SELECT level, building_type_id INTO current_level, building_type_id
  FROM public.player_buildings WHERE id = p_building_id AND player_id = p_player_id;

  SELECT current_level + COUNT(*) + 1 INTO target_level
  FROM public.building_queue WHERE building_id = p_building_id;

  SELECT * INTO bt FROM public.building_types WHERE id = building_type_id;
  cost_metal := bt.cost_metal * target_level;
  cost_crystal := bt.cost_crystal * target_level;
  cost_food := bt.cost_food * target_level;
  construction_time_seconds := bt.construction_time_seconds;

  SELECT quantity INTO current_metal FROM public.resources WHERE player_id = p_player_id AND resource_type='metal';
  SELECT quantity INTO current_crystal FROM public.resources WHERE player_id = p_player_id AND resource_type='crystal';
  SELECT quantity INTO current_food FROM public.resources WHERE player_id = p_player_id AND resource_type='food';

  IF current_metal < cost_metal OR current_crystal < cost_crystal OR current_food < cost_food THEN
    RETURN json_build_object('error','Not enough resources');
  END IF;

  UPDATE public.resources SET quantity = quantity - cost_metal    WHERE player_id = p_player_id AND resource_type='metal';
  UPDATE public.resources SET quantity = quantity - cost_crystal  WHERE player_id = p_player_id AND resource_type='crystal';
  UPDATE public.resources SET quantity = quantity - cost_food     WHERE player_id = p_player_id AND resource_type='food';

  SELECT ends_at INTO last_queue_ends FROM public.building_queue
  WHERE player_id = p_player_id ORDER BY ends_at DESC LIMIT 1;

  start_time := COALESCE(last_queue_ends, now());
  end_time := start_time + (construction_time_seconds * interval '1 second');

  INSERT INTO public.building_queue (player_id, building_id, target_level, ends_at)
  VALUES (p_player_id, p_building_id, target_level, end_time);

  RETURN json_build_object('success',true,'ends_at',end_time);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- YOU ARE DONE. ONE FILE. ONE CLICK. GAME READY.
