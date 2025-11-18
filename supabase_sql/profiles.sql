-- =============================================
-- PROFILES TABLE + ROBUST NEW USER TRIGGER
-- =============================================

-- 1. Ensure profiles table has proper constraints
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_username_key UNIQUE (username),
  ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- Recommended: case-insensitive unique indexes (prevents Player1 vs player1)
DROP INDEX IF EXISTS profiles_username_lower_idx;
CREATE UNIQUE INDEX profiles_username_lower_idx 
ON public.profiles (lower(username));

DROP INDEX IF EXISTS profiles_email_lower_idx;
CREATE UNIQUE INDEX profiles_email_lower_idx 
ON public.profiles (lower(email));

-- 2. The ultimate handle_new_user() function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE 
  random_planet_id int;
  raw_username text;
  base_username text;
  final_username text;
  counter int := 0;
BEGIN
  -- Extract username from metadata
  raw_username := trim(COALESCE(new.raw_user_meta_data ->> 'username', ''));

  -- Generate base username
  IF raw_username = '' OR raw_username IS NULL THEN
    base_username := 'player_' || substr(md5(new.id::text), 1, 8);
  ELSE
    -- Clean: only letters, numbers, underscores
    base_username := lower(regexp_replace(raw_username, '[^a-zA-Z0-9_]', '', 'g'));
    IF length(base_username) < 3 THEN
      base_username := 'user_' || substr(md5(new.id::text), 1, 8);
    END IF;
  END IF;

  -- Try to insert profile with unique username
  LOOP
    final_username := base_username || CASE WHEN counter > 0 THEN counter::text ELSE '' END;

    BEGIN
      INSERT INTO public.profiles (id, email, username)
      VALUES (new.id, lower(new.email), final_username);

      EXIT; -- Success!

    EXCEPTION WHEN unique_violation THEN
      IF SQLERRM LIKE '%profiles_username_lower_idx%' OR SQLERRM LIKE '%profiles_username_key%' THEN
        counter := counter + 1;
        IF counter > 100 THEN
          -- Last resort: super unique
          base_username := 'user_' || substr(md5(new.id::text || now()::text), 1, 12);
          counter := 0;
        END IF;
      ELSE
        -- Probably email already exists → block signup
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

  -- Give starting resources
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

-- 3. Recreate the trigger (just in case)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
