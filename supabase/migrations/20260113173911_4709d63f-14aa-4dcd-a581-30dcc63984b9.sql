-- Update the assign_admin_on_signup function with the new master email
CREATE OR REPLACE FUNCTION public.assign_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Auto-assign admin role for the master email
  IF NEW.email = 'eusoumauriciopaiva1@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::dev_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update the is_developer function to include the new master email
CREATE OR REPLACE FUNCTION public.is_developer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = _user_id
      AND email = 'eusoumauriciopaiva1@gmail.com'
  ) OR public.is_admin(_user_id)
$function$;

-- Update handle_new_user to reserve ZADM nickname and Z-MASTER code for the master email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if this is the master admin email
  IF NEW.email = 'eusoumauriciopaiva1@gmail.com' THEN
    INSERT INTO public.profiles (user_id, name, nickname, unique_code)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'name', 'ZONNA ADMIN'),
      'ZADM',
      'Z-MASTER'
    );
  ELSE
    INSERT INTO public.profiles (user_id, name, unique_code)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'name', 'Atleta'),
      public.generate_unique_code()
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Create a function to validate reserved nicknames
CREATE OR REPLACE FUNCTION public.validate_nickname()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_email TEXT;
BEGIN
  -- Get the user's email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;
  
  -- Check if trying to use reserved nickname ZADM
  IF UPPER(NEW.nickname) = 'ZADM' AND user_email != 'eusoumauriciopaiva1@gmail.com' THEN
    RAISE EXCEPTION 'O nickname ZADM é reservado para o Administrador Master';
  END IF;
  
  -- Check if trying to use reserved unique code Z-MASTER
  IF UPPER(NEW.unique_code) = 'Z-MASTER' AND user_email != 'eusoumauriciopaiva1@gmail.com' THEN
    RAISE EXCEPTION 'O código Z-MASTER é reservado para o Administrador Master';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to validate nicknames on insert/update
DROP TRIGGER IF EXISTS validate_nickname_trigger ON public.profiles;
CREATE TRIGGER validate_nickname_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_nickname();