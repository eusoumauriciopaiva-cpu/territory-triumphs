-- =============================================
-- ZONNA DEEP RESTRUCTURE: ADMIN MASTER SYSTEM
-- =============================================

-- 1. COMPLETE DATA RESET
DELETE FROM public.challenges;
DELETE FROM public.conquests;
DELETE FROM public.group_members;
DELETE FROM public.groups;
DELETE FROM public.user_roles;
DELETE FROM public.profiles;

-- 2. CREATE ADMIN ROLE TYPE IF NOT EXISTS
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
    CREATE TYPE public.admin_role AS ENUM ('user', 'admin');
  END IF;
END $$;

-- 3. ADD ADMIN ROLE TO EXISTING dev_role ENUM
ALTER TYPE public.dev_role ADD VALUE IF NOT EXISTS 'admin';

-- 4. CREATE FUNCTION TO AUTO-ASSIGN ADMIN ROLE ON SIGNUP
CREATE OR REPLACE FUNCTION public.assign_admin_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-assign admin role for the master email
  IF NEW.email = 'eusoumauriciopaiva@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::dev_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. CREATE TRIGGER TO AUTO-ASSIGN ADMIN ON NEW USER
DROP TRIGGER IF EXISTS on_auth_user_created_assign_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_on_signup();

-- 6. CREATE FUNCTION TO CHECK IF USER IS ADMIN
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
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
      AND role = 'admin'::dev_role
  )
$$;

-- 7. CREATE ADMIN-ONLY FUNCTION TO GET ALL CONQUESTS WITH PROFILES
CREATE OR REPLACE FUNCTION public.get_all_conquests_admin()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  path jsonb,
  area integer,
  distance numeric,
  duration integer,
  created_at timestamp with time zone,
  profile_name text,
  profile_nickname text,
  trail_color text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admin users
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.path,
    c.area,
    c.distance,
    c.duration,
    c.created_at,
    p.name::text as profile_name,
    p.nickname::text as profile_nickname,
    p.trail_color::text as trail_color
  FROM public.conquests c
  JOIN public.profiles p ON c.user_id = p.user_id
  ORDER BY c.created_at DESC;
END;
$$;

-- 8. FIX SECURITY: ADD MISSING DELETE POLICIES
-- Groups: Only creator can delete
CREATE POLICY "Group creator can delete"
ON public.groups
FOR DELETE
USING (auth.uid() = created_by);

-- Challenges: Participants can delete pending challenges
CREATE POLICY "Challenge participants can delete pending"
ON public.challenges
FOR DELETE
USING (
  (auth.uid() = challenger_id OR auth.uid() = challenged_id)
  AND status = 'pending'
);

-- Profiles: Only owner can delete their profile
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- 9. SECURE USER_ROLES TABLE - ADMIN ONLY WRITE ACCESS
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.is_admin(auth.uid()));

-- 10. UPDATE is_developer TO INCLUDE ADMIN CHECK
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
  ) OR public.is_admin(_user_id)
$$;