-- Fix the handle_new_user function to properly parse game preferences from signup metadata
-- This handles both formats: object with booleans (from signup) and array (from login)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
  games_array text[];
BEGIN
  -- Initialize empty array
  games_array := ARRAY[]::text[];
  
  -- First check if selected_games exists as an array (from login flow)
  IF new.raw_user_meta_data ? 'selected_games' AND jsonb_typeof(new.raw_user_meta_data->'selected_games') = 'array' THEN
    games_array := ARRAY(SELECT jsonb_array_elements_text(new.raw_user_meta_data->'selected_games'));
  -- Then check if games object exists (from signup flow)
  ELSIF new.raw_user_meta_data ? 'games' AND jsonb_typeof(new.raw_user_meta_data->'games') = 'object' THEN
    IF (new.raw_user_meta_data->'games'->>'tradingCardGame')::boolean THEN
      games_array := array_append(games_array, 'tcg');
    END IF;
    IF (new.raw_user_meta_data->'games'->>'videoGame')::boolean THEN
      games_array := array_append(games_array, 'video');
    END IF;
    IF (new.raw_user_meta_data->'games'->>'pocket')::boolean THEN
      games_array := array_append(games_array, 'pocket');
    END IF;
  END IF;
  
  -- If no games were selected, use defaults
  IF array_length(games_array, 1) IS NULL THEN
    games_array := ARRAY['tcg', 'video', 'pocket'];
  END IF;
  
  INSERT INTO public.profiles (id, email, selected_games)
  VALUES (
    new.id, 
    new.email,
    games_array
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;