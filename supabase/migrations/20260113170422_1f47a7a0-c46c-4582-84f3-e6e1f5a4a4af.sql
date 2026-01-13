-- RESET ALL DATA
DELETE FROM public.challenges;
DELETE FROM public.conquests;
DELETE FROM public.group_members;
DELETE FROM public.groups;
DELETE FROM public.profiles;

-- Create role enum for developers
DO $$ BEGIN
  CREATE TYPE public.dev_role AS ENUM ('admin', 'developer', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table for secure role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role dev_role NOT NULL DEFAULT 'user',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_dev_role(_user_id uuid, _role dev_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is developer by email
CREATE OR REPLACE FUNCTION public.is_developer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = _user_id
      AND email = 'eusoumauriciopaiva@gmail.com'
  )
$$;

-- Function to get all profiles with emails (only for developers)
CREATE OR REPLACE FUNCTION public.get_all_profiles_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  name text,
  nickname text,
  unique_code text,
  avatar_url text,
  level integer,
  xp integer,
  total_area integer,
  total_km numeric,
  rank app_rank,
  current_streak integer,
  best_streak integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow the specific developer email
  IF NOT public.is_developer(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Developer access required';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    u.email::text,
    p.name,
    p.nickname,
    p.unique_code,
    p.avatar_url,
    p.level,
    p.xp,
    p.total_area,
    p.total_km,
    p.rank,
    p.current_streak,
    p.best_streak,
    p.created_at
  FROM public.profiles p
  JOIN auth.users u ON p.user_id = u.id
  ORDER BY p.created_at DESC;
END;
$$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);