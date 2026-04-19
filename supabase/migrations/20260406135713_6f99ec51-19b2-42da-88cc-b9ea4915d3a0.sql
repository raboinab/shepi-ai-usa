
ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS supporting_evidence text[];

ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS source_observation_ids uuid[];

ALTER TABLE public.tensions ADD COLUMN IF NOT EXISTS magnitude_basis text;

ALTER TABLE public.hypotheses ADD COLUMN IF NOT EXISTS impact_direction text;
ALTER TABLE public.hypotheses ADD COLUMN IF NOT EXISTS supporting_observation_ids uuid[];
ALTER TABLE public.hypotheses ADD COLUMN IF NOT EXISTS required_resolvers text[];
ALTER TABLE public.hypotheses ADD COLUMN IF NOT EXISTS resolution_result text;
ALTER TABLE public.hypotheses ADD COLUMN IF NOT EXISTS final_ebitda_impact numeric;
ALTER TABLE public.hypotheses ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

ALTER TABLE public.findings ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.findings ADD COLUMN IF NOT EXISTS direction text;
ALTER TABLE public.findings ADD COLUMN IF NOT EXISTS adjustment_class text;
ALTER TABLE public.findings ADD COLUMN IF NOT EXISTS identified_items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.findings ADD COLUMN IF NOT EXISTS key_signals text[];
ALTER TABLE public.findings ADD COLUMN IF NOT EXISTS assumptions text[];
ALTER TABLE public.findings ADD COLUMN IF NOT EXISTS what_we_cannot_verify text[];
ALTER TABLE public.findings ADD COLUMN IF NOT EXISTS alternative_explanations_considered text[];
ALTER TABLE public.findings ADD COLUMN IF NOT EXISTS outcome_explanation text;

ALTER TABLE public.entity_nodes ADD COLUMN IF NOT EXISTS linked_txn_count integer DEFAULT 0;
ALTER TABLE public.entity_nodes ADD COLUMN IF NOT EXISTS linked_txn_total numeric DEFAULT 0;
