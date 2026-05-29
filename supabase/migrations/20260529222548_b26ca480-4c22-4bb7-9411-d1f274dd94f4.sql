UPDATE public.projects
SET wizard_data = wizard_data - 'trialBalance'
WHERE id = 'fa0768ca-96f9-4ded-b498-f64ca5be3ede'
  AND wizard_data ? 'trialBalance';