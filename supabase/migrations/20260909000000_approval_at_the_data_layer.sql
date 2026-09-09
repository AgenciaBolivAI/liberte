-- Approval was enforced ONLY in the app, never in the database.
--
-- Four content tables were readable by any authenticated user, approved or
-- denied, straight through PostgREST with the publishable key and a JWT taken
-- from localStorage:
--   calendar_events   → zoom_url + zoom_id of every live class
--   recorded_classes  → video_url of every replay
--   plus_resources    → the paid extra material
--   authored_days     → the published lesson JSON for weeks 3-8
-- and `messages` let any signed-in account INSERT to any staff UUID, bypassing
-- requireApprovedStudent in the server function that was supposed to be the
-- guard.
--
-- The app-level gate is real but it is a UI gate: AuthGate renders
-- PendingApproval instead of the content. Nothing stopped a direct REST call.
--
-- Blast radius measured before applying: 43 profiles, 42 approved, 1 not
-- approved, 0 denied; all 7 staff (3 coach + 4 admin) have approved_at set. So
-- this locks out exactly the one account it is meant to lock out.

-- SECURITY DEFINER so the policy can read profiles.approved_at without the
-- caller needing a profiles SELECT policy of its own; STABLE so Postgres may
-- cache it per statement; search_path pinned so it cannot be shadowed.
CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- Staff are approved by definition. A coach hired last week has no
    -- approved_at and must not lose the calendar.
    public.has_role(_user_id, 'coach'::app_role)
      OR public.has_role(_user_id, 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = _user_id
          AND p.approved_at IS NOT NULL
          AND p.denied_at IS NULL
      ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_approved(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_approved(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------- content --

DROP POLICY IF EXISTS "Authenticated read calendar events" ON public.calendar_events;
CREATE POLICY "Approved read calendar events"
  ON public.calendar_events FOR SELECT TO authenticated
  USING (public.is_approved(auth.uid()));

DROP POLICY IF EXISTS "students read recorded classes" ON public.recorded_classes;
CREATE POLICY "approved read recorded classes"
  ON public.recorded_classes FOR SELECT TO authenticated
  USING (public.is_approved(auth.uid()));

DROP POLICY IF EXISTS "students read plus resources" ON public.plus_resources;
CREATE POLICY "approved read plus resources"
  ON public.plus_resources FOR SELECT TO authenticated
  USING (public.is_approved(auth.uid()));

-- Staff keep their own read of DRAFT days; students need approval for published.
DROP POLICY IF EXISTS "read published or staff days" ON public.authored_days;
CREATE POLICY "read published or staff days"
  ON public.authored_days FOR SELECT TO authenticated
  USING (
    (status = 'published' AND public.is_approved(auth.uid()))
    OR has_role(auth.uid(), 'coach'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- --------------------------------------------------------------- messages --
-- Still "only ever as yourself", plus "only if you are actually a member of
-- this school".
DROP POLICY IF EXISTS "send own messages" ON public.messages;
CREATE POLICY "send own messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND public.is_approved(auth.uid()));
