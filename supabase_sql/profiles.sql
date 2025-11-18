-- =====================================================
-- COMPLETE & SAFE profiles.sql – RUN THIS EXACTLY AS-IS
-- =====================================================

-- 1. Create the profiles table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  email text,
  role text DEFAULT 'player'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Now we can safely add the unique constraints
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_username_key UNIQUE (username),
  ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- 3. Case-insensitive unique indexes (prevents Player1 vs player1)
DROP INDEX IF EXISTS public.profiles_username_lower_idx;
CREATE UNIQUE INDEX profiles_username_lower_idx 
  ON public.profiles (lower(username));

DROP INDEX IF EXISTS public.profiles_email_lower_idx;
CREATE UNIQUE INDEX profiles_email_lower_idx 
  ON public.profiles (lower(email));

-- 4. The bulletproof handle_new_user() function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE 
  random_planet_id int;
  raw_username text;
  base_username text;
  final_username text;
  counter int := 0;
BEGIN
  -- Extract and clean username
  raw_username := trim(COALESCE(new.raw_user_meta_data ->> 'username', ''));

  IF raw_username = '' OR raw_username IS NULL THEN
    base_username := 'player_' || substr(md5(new.id::text), 1, 8);
  ELSE
    base_username := lower(regexp_replace(raw_username, '[^a-zA-Z0-9_]', '', 'g'));
    IF length(base_username) < 3 THEN
      base_username := 'user_' || substr(md5(new.id::text), 1, 8);
    END IF;
  END IF;

  -- Ensure unique username
  LOOP
    final_username := base_username || CASE WHEN counter > 0 THEN counter::text ELSE '' END;

    BEGIN
      INSERT INTO public.profiles (id, email, username)
      VALUES (new.id, lower(new.email), final_username);
      EXIT;

    EXCEPTION WHEN unique_violation THEN
      IF SQLERRM LIKE '%profiles_username%' THEN
        counter := counter + 1;
        IF counter > 100 THEN
          base_username := 'user_' || substr(md5(new.id::text || now()::text), 1, 12);
          counter := 0;
        END IF;
      ELSE
        RAISE EXCEPTION 'Email already in use';
      END IF;
    END;
  END LOOP;

  -- Assign random planet
  SELECT id INTO random_planet_id 
  FROM public.planets 
  ORDER BY random() LIMIT 1;

  INSERT INTO public.players (id, planet_id)
  VALUES (new.id, random_planet_id)
  ON CONFLICT (id) DO NOTHING;

  -- Starting resources
  INSERT INTO public.resources (player_id, resource_type, quantity)
  VALUES 
    (new.id, 'Oxygen', 100),
    (new.id, 'Metal', 100),
    (new.id, 'Crystal', 100),
    (new.id, 'Food', 100)
  ON CONFLICT (player_id, resource_type) DO UPDATE 
  SET quantity = excluded.quantity;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Done!
