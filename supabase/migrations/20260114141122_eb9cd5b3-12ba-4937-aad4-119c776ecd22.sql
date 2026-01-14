-- Create conquest_posts table for feed with title, description, photos
CREATE TABLE public.conquest_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conquest_id UUID NOT NULL REFERENCES public.conquests(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  photo_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  map_snapshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conquest_posts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view conquest posts"
ON public.conquest_posts
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own posts"
ON public.conquest_posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
ON public.conquest_posts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
ON public.conquest_posts
FOR DELETE
USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_conquest_posts_user ON public.conquest_posts(user_id);
CREATE INDEX idx_conquest_posts_created ON public.conquest_posts(created_at DESC);

-- Create storage bucket for conquest photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'conquest-photos', 
  'conquest-photos', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Storage policies for conquest photos
CREATE POLICY "Anyone can view conquest photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'conquest-photos');

CREATE POLICY "Authenticated users can upload conquest photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'conquest-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own conquest photos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'conquest-photos' AND auth.uid()::text = (storage.foldername(name))[1]);