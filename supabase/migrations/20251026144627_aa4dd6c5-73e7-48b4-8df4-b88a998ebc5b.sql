-- Create storage bucket for face images
INSERT INTO storage.buckets (id, name, public)
VALUES ('faces', 'faces', true)
ON CONFLICT (id) DO NOTHING;

-- Create table for known faces
CREATE TABLE IF NOT EXISTS public.known_faces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  descriptor JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.known_faces ENABLE ROW LEVEL SECURITY;

-- Allow public read access to known faces
CREATE POLICY "Public read access to known faces"
ON public.known_faces
FOR SELECT
USING (true);

-- Allow public insert access (for adding new faces)
CREATE POLICY "Public insert access to known faces"
ON public.known_faces
FOR INSERT
WITH CHECK (true);

-- Allow public update access
CREATE POLICY "Public update access to known faces"
ON public.known_faces
FOR UPDATE
USING (true);

-- Storage policies for face images
CREATE POLICY "Public read access to faces bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'faces');

CREATE POLICY "Public upload access to faces bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'faces');

CREATE POLICY "Public update access to faces bucket"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'faces');