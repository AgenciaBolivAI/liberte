-- Durable log of AI-tutor corrections ("failed attempts"): each time Lib has to
-- correct the student, we record what they said, the corrected French, and the
-- rule. The tutor conversation itself is overwritten on day-switch and capped,
-- so without this the teacher report cannot show how a student is doing with the
-- tutor over time. Written server-side with the service role.

CREATE TABLE IF NOT EXISTS public.tutor_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_id INT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('correction')),
  said TEXT,
  corrected TEXT,
  rule_es TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tutor_events_user_idx ON public.tutor_events (user_id, created_at DESC);

GRANT SELECT ON public.tutor_events TO authenticated;
GRANT ALL ON public.tutor_events TO service_role;

ALTER TABLE public.tutor_events ENABLE ROW LEVEL SECURITY;

-- The student sees their own; coaches/admins see everyone's. No INSERT grant to
-- authenticated — the tutor server fn writes with the service role so a student
-- can't forge their own performance record.
DROP POLICY IF EXISTS "read own or staff tutor events" ON public.tutor_events;
CREATE POLICY "read own or staff tutor events"
  ON public.tutor_events FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'coach')
    OR public.has_role(auth.uid(), 'admin')
  );
