CREATE TABLE public.weekly_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number integer NOT NULL,
  test_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  test_score numeric NOT NULL DEFAULT 0,
  weekly_score numeric NOT NULL DEFAULT 0,
  ai_report jsonb NOT NULL DEFAULT '{}'::jsonb,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  pdf_generated boolean NOT NULL DEFAULT false,
  pdf_generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_evaluations TO authenticated;
GRANT ALL ON public.weekly_evaluations TO service_role;

ALTER TABLE public.weekly_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own weekly evals"
  ON public.weekly_evaluations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches and admins read all weekly evals"
  ON public.weekly_evaluations FOR SELECT
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_weekly_evaluations_updated_at
  BEFORE UPDATE ON public.weekly_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();