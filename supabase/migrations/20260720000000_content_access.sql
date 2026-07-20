-- Unified content-access overrides.
--
-- Admins/coaches can enable ('open') or disable ('locked') any DAY (1-120) or
-- WEEK (1-24), either GLOBALLY (all students) or for a single student. This is
-- the "no limits" control the client asked for and it supersedes the grant-only
-- `week_unlocks` table for new work (week_unlocks stays readable for backward
-- compatibility; nothing here deletes it).
--
-- Resolution precedence when deciding a day for a student (most specific first):
--   per-user day  ->  per-user week  ->  global day  ->  global week  ->  default
-- where the default is "weeks 1-2 (days 1-10) open, everything else locked".
-- The important consequence: an explicit 'locked' override WINS over the
-- launch open-window (OPEN_THROUGH_DAY), which today force-opens days 1-10 and
-- makes admin locks impossible. See src/lib/unlock.ts.

CREATE TABLE IF NOT EXISTS public.content_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL CHECK (scope IN ('global', 'user')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('day', 'week')),
  target_id INT NOT NULL,
  access TEXT NOT NULL CHECK (access IN ('open', 'locked')),
  set_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- global rows have no user_id; user rows must have one.
  CONSTRAINT content_access_scope_user CHECK ((scope = 'global') = (user_id IS NULL)),
  -- days are 1..120, weeks are 1..24.
  CONSTRAINT content_access_target_range CHECK (
    (target_type = 'day' AND target_id BETWEEN 1 AND 120)
    OR (target_type = 'week' AND target_id BETWEEN 1 AND 24)
  )
);

-- One override per (global, target) and one per (user, target).
CREATE UNIQUE INDEX IF NOT EXISTS content_access_global_uk
  ON public.content_access (target_type, target_id) WHERE scope = 'global';
CREATE UNIQUE INDEX IF NOT EXISTS content_access_user_uk
  ON public.content_access (user_id, target_type, target_id) WHERE scope = 'user';

-- Students only ever SELECT (their own + global). All writes go through the
-- role-checked server fns using the service-role client.
GRANT SELECT ON public.content_access TO authenticated;
GRANT ALL ON public.content_access TO service_role;

ALTER TABLE public.content_access ENABLE ROW LEVEL SECURITY;

-- Read: a student sees global overrides and their own; staff see everything.
DROP POLICY IF EXISTS "read content access" ON public.content_access;
CREATE POLICY "read content access"
  ON public.content_access FOR SELECT TO authenticated
  USING (
    scope = 'global'
    OR user_id = auth.uid()
    OR public.has_role(auth.uid(), 'coach')
    OR public.has_role(auth.uid(), 'admin')
  );

-- Write: coaches/admins only (defense in depth; server fns use service_role).
DROP POLICY IF EXISTS "staff write content access" ON public.content_access;
CREATE POLICY "staff write content access"
  ON public.content_access FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));

-- Auto-touch updated_at (function created by an earlier migration).
DROP TRIGGER IF EXISTS content_access_updated_at ON public.content_access;
CREATE TRIGGER content_access_updated_at
  BEFORE UPDATE ON public.content_access
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
