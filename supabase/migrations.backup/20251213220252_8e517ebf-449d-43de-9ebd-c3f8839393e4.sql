-- Add Google Sheet columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS google_sheet_id TEXT,
ADD COLUMN IF NOT EXISTS google_sheet_url TEXT;