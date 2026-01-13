-- Fix function search path warning for calculate_rank
CREATE OR REPLACE FUNCTION public.calculate_rank(xp_value INTEGER)
RETURNS app_rank
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN CASE
    WHEN xp_value >= 50000 THEN 'emperor'::app_rank
    WHEN xp_value >= 25000 THEN 'grandmaster'::app_rank
    WHEN xp_value >= 10000 THEN 'master'::app_rank
    WHEN xp_value >= 5000 THEN 'diamond'::app_rank
    WHEN xp_value >= 2500 THEN 'platinum'::app_rank
    WHEN xp_value >= 1000 THEN 'gold'::app_rank
    WHEN xp_value >= 500 THEN 'silver'::app_rank
    ELSE 'bronze'::app_rank
  END;
END;
$$;