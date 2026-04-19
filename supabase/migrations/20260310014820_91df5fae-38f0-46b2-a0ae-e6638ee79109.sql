
-- Clear all AI Discovery data for project 7ed459ed-a728-4bec-9e9d-b35eb036d46a
DELETE FROM proposal_evidence WHERE proposal_id IN (
  SELECT id FROM adjustment_proposals WHERE project_id = '7ed459ed-a728-4bec-9e9d-b35eb036d46a'
);
DELETE FROM adjustment_proposals WHERE project_id = '7ed459ed-a728-4bec-9e9d-b35eb036d46a';
DELETE FROM detector_runs WHERE project_id = '7ed459ed-a728-4bec-9e9d-b35eb036d46a';
DELETE FROM canonical_transactions WHERE project_id = '7ed459ed-a728-4bec-9e9d-b35eb036d46a';
DELETE FROM analysis_jobs WHERE project_id = '7ed459ed-a728-4bec-9e9d-b35eb036d46a';
