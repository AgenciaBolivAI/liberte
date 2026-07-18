
CREATE TABLE public.week_unlocks (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number int NOT NULL CHECK (week_number BETWEEN 1 AND 24),
  unlocked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.week_unlocks TO authenticated;
GRANT ALL ON public.week_unlocks TO service_role;

ALTER TABLE public.week_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own week unlocks"
  ON public.week_unlocks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches read all week unlocks"
  ON public.week_unlocks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches insert week unlocks"
  ON public.week_unlocks FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches delete week unlocks"
  ON public.week_unlocks FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));
