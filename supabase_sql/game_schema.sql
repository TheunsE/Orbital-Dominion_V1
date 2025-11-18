-- 1. Create building_types table (no dependencies)
CREATE TABLE public.building_types (
  id serial PRIMARY KEY,
  name text NOT NULL,
  cost integer NOT NULL DEFAULT 100,
  tier integer NOT NULL DEFAULT 1,
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
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Create resource_definitions table (no dependencies)
CREATE TABLE public.resource_definitions (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Create guilds table (no dependencies)
CREATE TABLE public.guilds (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Create planets table (no dependencies)
CREATE TABLE public.planets (
  id serial PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. Create players table (depends on profiles, which is handled by a trigger)
CREATE TABLE public.players (
  id uuid NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  planet_id integer REFERENCES public.planets(id),
  created_at timestamp with time zone DEFAULT now()
);

-- 6. Create resources table (depends on players and resource_definitions)
CREATE TABLE public.resources (
  id serial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  resource_type text NOT NULL REFERENCES public.resource_definitions(name),
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- 7. Create player_buildings table (depends on players and building_types)
CREATE TABLE public.player_buildings (
  id serial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  building_type_id integer NOT NULL REFERENCES public.building_types(id) ON DELETE CASCADE,
  level integer NOT NULL DEFAULT 1,
  construction_ends_at timestamptz,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT level_cap CHECK (level <= 10)
);

-- 8. Create guild_members table (depends on players and guilds)
CREATE TABLE public.guild_members (
  id serial PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  guild_id integer NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- 9. Create player_stats table (depends on players)
CREATE TABLE public.player_stats (
  id uuid NOT NULL PRIMARY KEY REFERENCES public.players(id) ON DELETE CASCADE,
  level integer NOT NULL DEFAULT 1,
  experience integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- 10. Create ship_types table
CREATE TABLE public.ship_types (
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
    created_at timestamp with time zone DEFAULT now()
);

-- 11. Create player_ships table
CREATE TABLE public.player_ships (
    id serial PRIMARY KEY,
    player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    ship_type_id integer NOT NULL REFERENCES public.ship_types(id) ON DELETE CASCADE,
    quantity integer NOT NULL DEFAULT 1,
    created_at timestamp with time zone DEFAULT now()
);

-- 12. Create tech_types table
CREATE TABLE public.tech_types (
    id serial PRIMARY KEY,
    name text NOT NULL,
    unlocks text,
    required_lab_level integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 13. Create player_techs table
CREATE TABLE public.player_techs (
    id serial PRIMARY KEY,
    player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    tech_type_id integer NOT NULL REFERENCES public.tech_types(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);

-- 14. Create artifact_types table
CREATE TABLE public.artifact_types (
    id serial PRIMARY KEY,
    name text NOT NULL,
    buff text,
    source text,
    created_at timestamp with time zone DEFAULT now()
);

-- 15. Create player_artifacts table
CREATE TABLE public.player_artifacts (
    id serial PRIMARY KEY,
    player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    artifact_type_id integer NOT NULL REFERENCES public.artifact_types(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);

-- Create tables: events, news, online_players
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists news (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text,
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists online_players (
  id uuid default gen_random_uuid() primary key,
  username text not null,
  status text default 'online',
  last_seen timestamptz default now()
);
