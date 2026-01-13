-- Create app_rank enum for the ranking system (Elos)
CREATE TYPE public.app_rank AS ENUM (
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond',
  'master',
  'grandmaster',
  'emperor'
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Atleta',
  avatar_url TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  total_area INTEGER NOT NULL DEFAULT 0,
  total_km NUMERIC(10,2) NOT NULL DEFAULT 0,
  rank app_rank NOT NULL DEFAULT 'bronze',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create conquests table for territory captures
CREATE TABLE public.conquests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  path JSONB NOT NULL,
  area INTEGER NOT NULL,
  distance NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create groups table
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_area INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create group_members junction table
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conquests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Conquests policies
CREATE POLICY "Users can view all conquests" ON public.conquests
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own conquests" ON public.conquests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conquests" ON public.conquests
  FOR DELETE USING (auth.uid() = user_id);

-- Groups policies
CREATE POLICY "Anyone can view groups" ON public.groups
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create groups" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Group creator can update" ON public.groups
  FOR UPDATE USING (auth.uid() = created_by);

-- Group members policies
CREATE POLICY "Anyone can view group members" ON public.group_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join groups" ON public.group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" ON public.group_members
  FOR DELETE USING (auth.uid() = user_id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Atleta'));
  RETURN NEW;
END;
$$;

-- Trigger for auto-creating profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate rank based on XP
CREATE OR REPLACE FUNCTION public.calculate_rank(xp_value INTEGER)
RETURNS app_rank
LANGUAGE plpgsql
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

-- Function to update user stats after conquest
CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_xp INTEGER;
  new_rank app_rank;
BEGIN
  UPDATE public.profiles
  SET 
    total_area = total_area + NEW.area,
    total_km = total_km + NEW.distance,
    xp = xp + (NEW.area / 10) + (NEW.distance::INTEGER * 100),
    level = ((xp + (NEW.area / 10) + (NEW.distance::INTEGER * 100)) / 1000) + 1,
    updated_at = now()
  WHERE user_id = NEW.user_id
  RETURNING xp INTO new_xp;
  
  new_rank := calculate_rank(new_xp);
  
  UPDATE public.profiles
  SET rank = new_rank
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update stats after conquest
CREATE TRIGGER on_conquest_created
  AFTER INSERT ON public.conquests
  FOR EACH ROW EXECUTE FUNCTION public.update_user_stats();

-- Function to update group stats
CREATE OR REPLACE FUNCTION public.update_group_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.groups g
  SET total_area = (
    SELECT COALESCE(SUM(c.area), 0)
    FROM public.conquests c
    INNER JOIN public.group_members gm ON c.user_id = gm.user_id
    WHERE gm.group_id = g.id
  );
  RETURN NEW;
END;
$$;

-- Updated at trigger for profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();