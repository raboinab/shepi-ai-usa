-- Enable realtime for projects table to listen for google_sheet_id changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;