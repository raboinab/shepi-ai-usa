CREATE TABLE public.demo_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  page text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own demo views"
  ON public.demo_views FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own demo views"
  ON public.demo_views FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all demo views"
  ON public.demo_views FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));