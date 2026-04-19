
DELETE FROM public.proposal_evidence
WHERE proposal_id IN (
  SELECT id FROM public.adjustment_proposals
  WHERE project_id = '7ed459ed-a728-4bec-9e9d-b35eb036d46a'
);
