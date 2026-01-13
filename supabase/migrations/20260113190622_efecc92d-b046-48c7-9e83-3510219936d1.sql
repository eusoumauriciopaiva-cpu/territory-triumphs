-- Create territory_conflicts table to track invasions
CREATE TABLE public.territory_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invader_id UUID NOT NULL,
  victim_id UUID NOT NULL,
  conquest_id UUID NOT NULL,
  area_invaded INTEGER NOT NULL DEFAULT 0,
  location_name TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  is_read_by_victim BOOLEAN NOT NULL DEFAULT false,
  is_read_by_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.territory_conflicts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view conflicts involving them"
ON public.territory_conflicts
FOR SELECT
USING (auth.uid() = invader_id OR auth.uid() = victim_id OR public.is_admin(auth.uid()));

CREATE POLICY "System can insert conflicts"
ON public.territory_conflicts
FOR INSERT
WITH CHECK (auth.uid() = invader_id);

CREATE POLICY "Victims can mark as read"
ON public.territory_conflicts
FOR UPDATE
USING (auth.uid() = victim_id OR public.is_admin(auth.uid()));

-- Index for performance
CREATE INDEX idx_territory_conflicts_victim ON public.territory_conflicts(victim_id);
CREATE INDEX idx_territory_conflicts_created ON public.territory_conflicts(created_at DESC);

-- Admin function to get all conflicts
CREATE OR REPLACE FUNCTION public.get_all_conflicts_admin()
RETURNS TABLE(
  id uuid,
  invader_id uuid,
  victim_id uuid,
  conquest_id uuid,
  area_invaded integer,
  location_name text,
  latitude numeric,
  longitude numeric,
  is_read_by_victim boolean,
  is_read_by_admin boolean,
  created_at timestamp with time zone,
  invader_name text,
  invader_nickname text,
  victim_name text,
  victim_nickname text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    tc.id,
    tc.invader_id,
    tc.victim_id,
    tc.conquest_id,
    tc.area_invaded,
    tc.location_name,
    tc.latitude,
    tc.longitude,
    tc.is_read_by_victim,
    tc.is_read_by_admin,
    tc.created_at,
    pi.name::text as invader_name,
    pi.nickname::text as invader_nickname,
    pv.name::text as victim_name,
    pv.nickname::text as victim_nickname
  FROM public.territory_conflicts tc
  JOIN public.profiles pi ON tc.invader_id = pi.user_id
  JOIN public.profiles pv ON tc.victim_id = pv.user_id
  ORDER BY tc.created_at DESC;
END;
$$;