-- Add streak tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- Add duration column to conquests for pace calculation
ALTER TABLE public.conquests
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0;

-- Create function to update streaks when conquest is added
CREATE OR REPLACE FUNCTION public.update_streak_on_conquest()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_date DATE;
  current_str INTEGER;
  best_str INTEGER;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Get current streak info
  SELECT last_activity_date, current_streak, best_streak
  INTO last_date, current_str, best_str
  FROM public.profiles
  WHERE user_id = NEW.user_id;
  
  -- Calculate new streak
  IF last_date IS NULL THEN
    -- First activity ever
    current_str := 1;
  ELSIF last_date = today_date THEN
    -- Already recorded today, no change
    NULL;
  ELSIF last_date = today_date - INTERVAL '1 day' THEN
    -- Consecutive day, increase streak
    current_str := current_str + 1;
  ELSE
    -- Streak broken, reset to 1
    current_str := 1;
  END IF;
  
  -- Update best streak if current is higher
  IF current_str > best_str THEN
    best_str := current_str;
  END IF;
  
  -- Update profile
  UPDATE public.profiles
  SET 
    current_streak = current_str,
    best_streak = best_str,
    last_activity_date = today_date
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for streak updates
DROP TRIGGER IF EXISTS update_streak_trigger ON public.conquests;
CREATE TRIGGER update_streak_trigger
AFTER INSERT ON public.conquests
FOR EACH ROW
EXECUTE FUNCTION public.update_streak_on_conquest();

-- Update XP calculation to include streak bonus and distance tiers
CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  distance_xp INTEGER;
  streak_bonus NUMERIC;
  current_str INTEGER;
  new_xp INTEGER;
  new_rank app_rank;
BEGIN
  -- Get current streak
  SELECT current_streak INTO current_str
  FROM public.profiles
  WHERE user_id = NEW.user_id;
  
  -- Calculate XP based on distance tiers
  -- 1km = 10pts base, but with tier bonuses
  IF NEW.distance >= 10 THEN
    distance_xp := 50 + (NEW.distance::INTEGER - 10) * 10;
  ELSIF NEW.distance >= 5 THEN
    distance_xp := 25 + (NEW.distance::INTEGER - 5) * 10;
  ELSE
    distance_xp := NEW.distance::INTEGER * 10;
  END IF;
  
  -- Add area bonus (1 XP per 100m²)
  distance_xp := distance_xp + (NEW.area / 100);
  
  -- Calculate streak bonus (10% per streak day, max 50%)
  streak_bonus := LEAST(0.5, COALESCE(current_str, 0) * 0.1);
  distance_xp := distance_xp + (distance_xp * streak_bonus)::INTEGER;
  
  -- Update profile stats
  UPDATE public.profiles
  SET 
    total_area = total_area + NEW.area,
    total_km = total_km + NEW.distance,
    xp = xp + distance_xp,
    level = ((xp + distance_xp) / 1000) + 1,
    updated_at = now()
  WHERE user_id = NEW.user_id
  RETURNING xp INTO new_xp;
  
  -- Calculate new rank
  new_rank := calculate_rank(new_xp);
  
  UPDATE public.profiles
  SET rank = new_rank
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;