-- Persistent AI student reports, visible to BOTH the teacher and the student
-- (client request 2026-07-26: "Both the teacher and the student should be able
-- to see the AI report to track progress"). One row per student = the latest
-- report; regeneration is cooldown-limited server-side (24h for students), so
-- storing it is what makes the report shareable AND caps the OpenAI spend.

CREATE TABLE IF NOT EXISTS public.ai_student_reports (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  report jsonb NOT NULL DEFAULT '{}'::jsonb,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  -- The 24h staleness check reads this; NOT NULL DEFAULT now() so a code path
  -- that forgets to set it can never produce a NULL that breaks the date math.
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Server-only writes (service role); students read their own row, staff read
-- all. Same hardening shape as star_awards: SELECT-only grant, no
-- INSERT/UPDATE policies at all. NOTE: the server fns read/write through the
-- service role, so these SELECT policies exist only for potential direct
-- client reads — the server path is canonical.
GRANT SELECT ON public.ai_student_reports TO authenticated;
GRANT ALL ON public.ai_student_reports TO service_role;

ALTER TABLE public.ai_student_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own ai report read" ON public.ai_student_reports;
CREATE POLICY "own ai report read"
  ON public.ai_student_reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "staff ai report read" ON public.ai_student_reports;
CREATE POLICY "staff ai report read"
  ON public.ai_student_reports FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'coach'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
