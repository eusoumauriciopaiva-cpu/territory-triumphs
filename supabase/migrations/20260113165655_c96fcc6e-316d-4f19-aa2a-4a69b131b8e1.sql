-- First add columns without unique constraint
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nickname text;

-- Add unique_code as nullable first
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS unique_code text;

-- Create function to generate unique Z-ID code
CREATE OR REPLACE FUNCTION public.generate_unique_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate random 4-digit number
    new_code := 'Z-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE unique_code = new_code) INTO code_exists;
    
    -- Exit loop if unique
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Update existing profiles with unique codes one by one
DO $$
DECLARE
  profile_record RECORD;
  new_code text;
  code_exists boolean;
BEGIN
  FOR profile_record IN SELECT id FROM public.profiles WHERE unique_code IS NULL OR unique_code = ''
  LOOP
    LOOP
      new_code := 'Z-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
      SELECT EXISTS(SELECT 1 FROM public.profiles WHERE unique_code = new_code) INTO code_exists;
      IF NOT code_exists THEN EXIT; END IF;
    END LOOP;
    
    UPDATE public.profiles SET unique_code = new_code WHERE id = profile_record.id;
  END LOOP;
END;
$$;

-- Now add unique constraints
ALTER TABLE public.profiles ADD CONSTRAINT profiles_nickname_key UNIQUE (nickname);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_unique_code_key UNIQUE (unique_code);

-- Set default for future inserts
ALTER TABLE public.profiles ALTER COLUMN unique_code SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN unique_code SET DEFAULT '';

-- Update handle_new_user function to generate unique_code on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, unique_code)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'Atleta'),
    public.generate_unique_code()
  );
  RETURN NEW;
END;
$function$;

-- Create indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON public.profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_profiles_unique_code ON public.profiles(unique_code);