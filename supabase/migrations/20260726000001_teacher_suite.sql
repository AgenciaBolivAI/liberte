-- Teacher suite: score overrides, per-student assigned teacher, and in-app
-- notifications (student activity → teacher/admin).

-- 1) Manual score overrides (client: the AI grading was too strict; coaches can
--    adjust). Audit columns record who touched what.
ALTER TABLE public.defi_results
  ADD COLUMN IF NOT EXISTS overridden_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS overridden_at timestamptz NULL;
ALTER TABLE public.weekly_evaluations
  ADD COLUMN IF NOT EXISTS overridden_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS overridden_at timestamptz NULL;

-- 2) Assigned teacher per student (future: several teachers; reports + activity
--    notifications route to this coach, falling back to all admins).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS assigned_coach uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3) In-app notifications. Written ONLY server-side (service role) when a
--    student completes a day / défi / weekly evaluation. Recipients read and
--    mark-read their own rows; nobody else sees them.
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,               -- 'day_completed' | 'defi_submitted' | 'weekly_evaluated' | …
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_recipient_idx
  ON public.notifications (recipient_id, read_at, created_at DESC);

-- Server-only writes: authenticated users can read + mark-read their own rows,
-- never insert (no spoofed "student finished" alerts).
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE (read_at) ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own notifications read" ON public.notifications;
CREATE POLICY "own notifications read"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "own notifications mark read" ON public.notifications;
CREATE POLICY "own notifications mark read"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- 4) Time-on-task: accumulated seconds the student spent inside each day
--    (incremented by the day page's autosave heartbeat; feeds coach analytics).
ALTER TABLE public.day_state
  ADD COLUMN IF NOT EXISTS seconds_spent integer NOT NULL DEFAULT 0;
