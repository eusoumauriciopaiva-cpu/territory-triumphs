-- Create table for daily missions tracking
CREATE TABLE public.user_missions_daily (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mission_type TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL,
  collected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_date, mission_type)
);

-- Enable RLS
ALTER TABLE public.user_missions_daily ENABLE ROW LEVEL SECURITY;

-- Users can view their own missions
CREATE POLICY "Users can view own missions"
ON public.user_missions_daily
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own missions
CREATE POLICY "Users can insert own missions"
ON public.user_missions_daily
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own missions
CREATE POLICY "Users can update own missions"
ON public.user_missions_daily
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_missions_daily_updated_at
BEFORE UPDATE ON public.user_missions_daily
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();