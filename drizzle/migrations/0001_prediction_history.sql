CREATE TABLE IF NOT EXISTS public.prediction_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month date NOT NULL,
  predicted_expense numeric(15, 2) NOT NULL DEFAULT 0,
  budget_goal numeric(15, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month),
  CHECK (predicted_expense >= 0),
  CHECK (budget_goal >= 0)
);

ALTER TABLE public.prediction_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their prediction history" ON public.prediction_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
