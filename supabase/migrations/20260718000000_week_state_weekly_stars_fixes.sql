-- 1) Per-week in-progress state for the weekly challenges (autosave/resume).
--    Mirrors day_state: the weekly défi routes hydrate from here so a student
--    who refreshes or logs out mid-test resumes where they left off.
CREATE TABLE IF NOT EXISTS public.week_state (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number INT NOT NULL CHECK (week_number BETWEEN 1 AND 24),
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.week_state TO authenticated;
GRANT ALL ON public.week_state TO service_role;
ALTER TABLE public.week_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_week_state_select" ON public.week_state FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_week_state_insert" ON public.week_state FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_week_state_update" ON public.week_state FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_week_state_delete" ON public.week_state FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_week_state_updated_at BEFORE UPDATE ON public.week_state FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) +3 stars when a weekly défi is completed (fires on the first save only:
--    the routes upsert weekly_evaluations, so later saves are UPDATEs).
CREATE OR REPLACE FUNCTION public.award_weekly_stars()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.star_awards (user_id, amount, reason, source_key)
  VALUES (NEW.user_id, 3, 'weekly_defi', 'weekly:' || NEW.week_number)
  ON CONFLICT (user_id, source_key) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.award_weekly_stars() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_award_weekly_stars ON public.weekly_evaluations;
CREATE TRIGGER trg_award_weekly_stars
  AFTER INSERT ON public.weekly_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.award_weekly_stars();

-- Backfill for students who already completed a weekly défi
INSERT INTO public.star_awards (user_id, amount, reason, source_key)
SELECT user_id, 3, 'weekly_defi', 'weekly:' || week_number
FROM public.weekly_evaluations
ON CONFLICT (user_id, source_key) DO NOTHING;

-- 3) week_unlocks had INSERT/DELETE policies but no UPDATE policy, so the
--    coach panel's re-unlock upsert silently failed on the ON CONFLICT path.
DROP POLICY IF EXISTS "Coaches update week unlocks" ON public.week_unlocks;
CREATE POLICY "Coaches update week unlocks"
  ON public.week_unlocks FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));

-- 4) Stars are only ever granted by SECURITY DEFINER triggers (which bypass
--    this as table owner). The client-side INSERT path was unused by the app
--    but let any student insert arbitrary star amounts for themselves.
DROP POLICY IF EXISTS "Users insert own stars" ON public.star_awards;
REVOKE INSERT ON public.star_awards FROM authenticated;
