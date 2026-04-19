
UPDATE projects 
SET wizard_data = jsonb_set(
  wizard_data, 
  '{ddAdjustments,adjustments}',
  (SELECT jsonb_agg(a) FROM jsonb_array_elements(wizard_data->'ddAdjustments'->'adjustments') a 
   WHERE a->>'id' NOT IN ('b1f50742-3ee1-4aec-879b-a159aa18a5c5', 'bf4cad63-1164-48b9-8889-0aef03eaa78e'))
)
WHERE id = '7ed459ed-a728-4bec-9e9d-b35eb036d46a';
