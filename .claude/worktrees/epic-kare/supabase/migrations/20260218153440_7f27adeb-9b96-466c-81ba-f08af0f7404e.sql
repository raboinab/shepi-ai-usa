
-- Add columns
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS job_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS document_type text DEFAULT NULL;

-- Sync trigger on UPDATE: keep job_id <-> docuclipper_job_id in sync
CREATE OR REPLACE FUNCTION public.sync_job_id_columns()
  RETURNS trigger LANGUAGE plpgsql
  SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.job_id IS DISTINCT FROM OLD.job_id
     AND NEW.job_id IS NOT NULL
     AND (NEW.docuclipper_job_id IS NOT DISTINCT FROM OLD.docuclipper_job_id) THEN
    NEW.docuclipper_job_id := NEW.job_id;
  END IF;
  IF NEW.docuclipper_job_id IS DISTINCT FROM OLD.docuclipper_job_id
     AND NEW.docuclipper_job_id IS NOT NULL
     AND (NEW.job_id IS NOT DISTINCT FROM OLD.job_id) THEN
    NEW.job_id := NEW.docuclipper_job_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_job_id
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.sync_job_id_columns();

-- Sync trigger on INSERT
CREATE OR REPLACE FUNCTION public.sync_job_id_on_insert()
  RETURNS trigger LANGUAGE plpgsql
  SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.job_id IS NOT NULL AND NEW.docuclipper_job_id IS NULL THEN
    NEW.docuclipper_job_id := NEW.job_id;
  ELSIF NEW.docuclipper_job_id IS NOT NULL AND NEW.job_id IS NULL THEN
    NEW.job_id := NEW.docuclipper_job_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_job_id_insert
  BEFORE INSERT ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.sync_job_id_on_insert();

-- Backfill existing data
UPDATE public.documents
SET job_id = docuclipper_job_id
WHERE docuclipper_job_id IS NOT NULL AND job_id IS NULL;

NOTIFY pgrst, 'reload schema';
