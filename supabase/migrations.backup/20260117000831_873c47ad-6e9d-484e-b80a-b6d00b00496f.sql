-- Create function to auto-populate user_id from projects table
CREATE OR REPLACE FUNCTION public.populate_company_info_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user_id is NULL, derive it from the project
  IF NEW.user_id IS NULL THEN
    SELECT user_id INTO NEW.user_id
    FROM public.projects
    WHERE id = NEW.project_id;
    
    -- If still NULL (project not found), raise an error
    IF NEW.user_id IS NULL THEN
      RAISE EXCEPTION 'Cannot create company_info: project_id % not found or has no user_id', NEW.project_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create BEFORE INSERT trigger on company_info
DROP TRIGGER IF EXISTS trigger_populate_company_info_user_id ON public.company_info;

CREATE TRIGGER trigger_populate_company_info_user_id
BEFORE INSERT ON public.company_info
FOR EACH ROW
EXECUTE FUNCTION public.populate_company_info_user_id();

-- Also add BEFORE UPDATE trigger to prevent user_id from being set to NULL
CREATE OR REPLACE FUNCTION public.prevent_null_company_info_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user_id is being set to NULL, restore from projects
  IF NEW.user_id IS NULL THEN
    SELECT user_id INTO NEW.user_id
    FROM public.projects
    WHERE id = NEW.project_id;
    
    -- If still NULL, keep the old value
    IF NEW.user_id IS NULL THEN
      NEW.user_id := OLD.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_null_company_info_user_id ON public.company_info;

CREATE TRIGGER trigger_prevent_null_company_info_user_id
BEFORE UPDATE ON public.company_info
FOR EACH ROW
EXECUTE FUNCTION public.prevent_null_company_info_user_id();