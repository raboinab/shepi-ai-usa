-- Create subscriptions table to track user subscription status
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  plan_type text NOT NULL CHECK (plan_type IN ('monthly', 'per_project')),
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'cancelled', 'past_due', 'inactive')),
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id)
);

-- Create project_payments table for per-project purchases
CREATE TABLE public.project_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stripe_payment_intent_id text UNIQUE,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  paid_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (project_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriptions
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
ON public.subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for project_payments
CREATE POLICY "Users can view their own project payments"
ON public.project_payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project payments"
ON public.project_payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at on subscriptions
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();