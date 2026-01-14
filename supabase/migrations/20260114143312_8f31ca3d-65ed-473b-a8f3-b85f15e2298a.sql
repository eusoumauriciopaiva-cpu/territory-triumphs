-- Create follows table for social following system
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Enable Row Level Security
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Create policies for follows
CREATE POLICY "Anyone can view follows"
ON public.follows
FOR SELECT
USING (true);

CREATE POLICY "Users can follow others"
ON public.follows
FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.follows
FOR DELETE
USING (auth.uid() = follower_id);

-- Create index for efficient queries
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- Add location columns to profiles for nearby filtering
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_latitude NUMERIC,
ADD COLUMN IF NOT EXISTS last_longitude NUMERIC;

-- Add location to conquests for nearby filtering
ALTER TABLE public.conquests
ADD COLUMN IF NOT EXISTS center_latitude NUMERIC,
ADD COLUMN IF NOT EXISTS center_longitude NUMERIC;