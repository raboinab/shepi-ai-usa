ALTER TABLE public.adjustment_proposals
  ADD COLUMN IF NOT EXISTS finding_group uuid;

COMMENT ON COLUMN public.adjustment_proposals.finding_group IS
  'UUID grouping proposals from the same multi-account finding so the frontend can cluster them visually. Pure display hint — no impact on scoring. Written by ai-adjustment-discovery runner.';

CREATE INDEX IF NOT EXISTS idx_adjustment_proposals_finding_group
  ON public.adjustment_proposals (finding_group)
  WHERE finding_group IS NOT NULL;
