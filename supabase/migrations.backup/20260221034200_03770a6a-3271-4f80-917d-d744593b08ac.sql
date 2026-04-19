
-- Create promo_config table
CREATE TABLE public.promo_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_config ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read promo config"
  ON public.promo_config
  FOR SELECT
  USING (true);

-- Only service_role can write
CREATE POLICY "Only service role can modify promo config"
  ON public.promo_config
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Auto-update trigger
CREATE TRIGGER update_promo_config_updated_at
  BEFORE UPDATE ON public.promo_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial data
INSERT INTO public.promo_config (key, value)
VALUES ('early_adopter_spots', 50);
