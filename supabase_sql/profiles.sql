-- 1. Create the profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text,
  role text DEFAULT 'player'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
-- 2. Create the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE random_planet_id int;
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (id, email, username)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'username');

-- Select a random planet for the new user
  SELECT id INTO random_planet_id FROM public.planets ORDER BY random() LIMIT 1;

-- Create a player entry for the new user
  INSERT INTO public.players (id, planet_id)
  VALUES (new.id, random_planet_id);

  -- Grant the new player all default resources
  INSERT INTO public.resources (player_id, resource_type, quantity)
  VALUES (new.id, 'Oxygen', 100),
         (new.id, 'Metal', 100),
         (new.id, 'Crystal', 100),
         (new.id, 'Food', 100);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger to execute the function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
