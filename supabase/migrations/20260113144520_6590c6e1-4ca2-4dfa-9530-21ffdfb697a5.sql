-- Add trail color customization to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trail_color TEXT NOT NULL DEFAULT '#FF4F00';

-- Add unlocked colors array (users unlock colors as they progress)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS unlocked_colors TEXT[] NOT NULL DEFAULT ARRAY['#FF4F00']::TEXT[];