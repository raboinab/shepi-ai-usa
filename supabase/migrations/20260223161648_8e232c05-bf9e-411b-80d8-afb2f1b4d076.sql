
-- Create a security definer function that allows project owners and admins to reset project data
CREATE OR REPLACE FUNCTION public.reset_project_data(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_project_owner uuid;
BEGIN
  -- Check the project exists and get owner
  SELECT user_id INTO v_project_owner
  FROM public.projects
  WHERE id = p_project_id;

  IF v_project_owner IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Only allow project owner or admin
  IF v_user_id != v_project_owner AND NOT has_role(v_user_id, 'admin') THEN
    RAISE EXCEPTION 'Permission denied: only project owner or admin can reset';
  END IF;

  -- Delete all related data (order matters for FK constraints)
  DELETE FROM public.adjustment_proofs WHERE project_id = p_project_id;
  DELETE FROM public.flagged_transactions WHERE project_id = p_project_id;
  DELETE FROM public.chat_messages WHERE project_id = p_project_id;
  DELETE FROM public.docuclipper_jobs WHERE project_id = p_project_id;
  DELETE FROM public.processed_data WHERE project_id = p_project_id;
  DELETE FROM public.documents WHERE project_id = p_project_id;
  DELETE FROM public.company_info WHERE project_id = p_project_id;
  DELETE FROM public.workflows WHERE project_id = p_project_id;

  -- Reset the project shell
  UPDATE public.projects SET
    wizard_data = '{}'::jsonb,
    current_phase = 1,
    current_section = 1,
    periods = '[]'::jsonb,
    fiscal_year_end = NULL,
    industry = NULL,
    google_sheet_id = NULL,
    google_sheet_url = NULL,
    status = 'draft'
  WHERE id = p_project_id;
END;
$$;
