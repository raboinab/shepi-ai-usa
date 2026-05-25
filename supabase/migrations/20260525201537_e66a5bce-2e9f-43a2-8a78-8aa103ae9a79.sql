
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS firm_name TEXT,
  ADD COLUMN IF NOT EXISTS firm_logo_path TEXT,
  ADD COLUMN IF NOT EXISTS prepared_by_line TEXT,
  ADD COLUMN IF NOT EXISTS professional_use_acknowledged_at TIMESTAMPTZ;

INSERT INTO storage.buckets (id, name, public)
VALUES ('firm-logos', 'firm-logos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Firm logos are publicly readable" ON storage.objects;
CREATE POLICY "Firm logos are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'firm-logos');

DROP POLICY IF EXISTS "Users can upload their own firm logo" ON storage.objects;
CREATE POLICY "Users can upload their own firm logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'firm-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own firm logo" ON storage.objects;
CREATE POLICY "Users can update their own firm logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'firm-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own firm logo" ON storage.objects;
CREATE POLICY "Users can delete their own firm logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'firm-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
