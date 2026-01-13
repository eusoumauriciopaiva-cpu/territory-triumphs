-- Add monthly distance tracking for elite status
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS monthly_km NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_elite BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Brasil';

-- Create challenges table for duels
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL,
  challenged_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  challenger_area INTEGER NOT NULL DEFAULT 0,
  challenged_area INTEGER NOT NULL DEFAULT 0,
  winner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

-- Enable RLS on challenges
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- RLS policies for challenges
CREATE POLICY "Users can view their challenges"
ON public.challenges FOR SELECT
USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

CREATE POLICY "Users can create challenges"
ON public.challenges FOR INSERT
WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update their challenges"
ON public.challenges FOR UPDATE
USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- Function to update group elite status (500km/month)
CREATE OR REPLACE FUNCTION public.update_group_elite_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update monthly_km and elite status for affected groups
  UPDATE public.groups g
  SET 
    monthly_km = (
      SELECT COALESCE(SUM(c.distance), 0)
      FROM public.conquests c
      INNER JOIN public.group_members gm ON c.user_id = gm.user_id
      WHERE gm.group_id = g.id
      AND c.created_at >= date_trunc('month', CURRENT_DATE)
    ),
    is_elite = (
      SELECT COALESCE(SUM(c.distance), 0) >= 500
      FROM public.conquests c
      INNER JOIN public.group_members gm ON c.user_id = gm.user_id
      WHERE gm.group_id = g.id
      AND c.created_at >= date_trunc('month', CURRENT_DATE)
    );
  
  RETURN NEW;
END;
$$;

-- Create trigger for elite status updates
DROP TRIGGER IF EXISTS update_elite_trigger ON public.conquests;
CREATE TRIGGER update_elite_trigger
AFTER INSERT ON public.conquests
FOR EACH ROW
EXECUTE FUNCTION public.update_group_elite_status();