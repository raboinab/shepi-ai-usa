
DO $$
DECLARE
  v_client uuid := 'cda05b8e-0813-42fe-a425-5e97584510e1'; -- client
  v_cpa    uuid := 'b68018c6-cb38-4b74-a786-251c072df5b0'; -- cpa
  v_project uuid := gen_random_uuid();
  v_claim uuid;
  v_msg_count int;
  v_client_access boolean;
  v_cpa_access boolean;
  v_share_exists boolean;
BEGIN
  -- 1. client creates a DFY project
  INSERT INTO public.projects (id, user_id, name, service_tier, status)
  VALUES (v_project, v_client, '__qa_chat_roundtrip__', 'done_for_you', 'draft');

  -- 2. CPA claims it (auto_share_on_cpa_claim trigger should grant project_shares)
  INSERT INTO public.cpa_claims (project_id, cpa_user_id, status, claimed_at)
  VALUES (v_project, v_cpa, 'accepted', now())
  RETURNING id INTO v_claim;

  -- assert share was created
  SELECT EXISTS (
    SELECT 1 FROM public.project_shares
    WHERE project_id = v_project AND shared_with_user_id = v_cpa
  ) INTO v_share_exists;
  RAISE NOTICE 'auto_share_on_cpa_claim created share row: %', v_share_exists;

  -- 3. assert both sides have project access per RLS helper
  SELECT public.has_project_access(v_client, v_project) INTO v_client_access;
  SELECT public.has_project_access(v_cpa, v_project)    INTO v_cpa_access;
  RAISE NOTICE 'client has_project_access: % | cpa has_project_access: %', v_client_access, v_cpa_access;

  -- 4. client sends a message
  INSERT INTO public.chat_messages (project_id, user_id, role, content, context_type)
  VALUES (v_project, v_client, 'user', 'hi from client', 'engagement');

  -- 5. cpa replies
  INSERT INTO public.chat_messages (project_id, user_id, role, content, context_type)
  VALUES (v_project, v_cpa, 'user', 'hi from CPA', 'engagement');

  -- 6. count what each side would see (mirrors RLS using_expr: has_project_access)
  SELECT count(*) INTO v_msg_count
  FROM public.chat_messages
  WHERE project_id = v_project AND context_type='engagement';
  RAISE NOTICE 'total engagement messages in slice (visible to both via RLS): %', v_msg_count;

  -- 7. cleanup
  DELETE FROM public.chat_messages WHERE project_id = v_project;
  DELETE FROM public.cpa_claims    WHERE project_id = v_project;
  DELETE FROM public.project_shares WHERE project_id = v_project;
  DELETE FROM public.projects      WHERE id = v_project;

  IF NOT v_share_exists OR NOT v_client_access OR NOT v_cpa_access OR v_msg_count <> 2 THEN
    RAISE EXCEPTION 'QA ROUND-TRIP FAILED — share=% client_access=% cpa_access=% msgs=%',
      v_share_exists, v_client_access, v_cpa_access, v_msg_count;
  END IF;

  RAISE NOTICE 'QA ROUND-TRIP PASSED';
END $$;
