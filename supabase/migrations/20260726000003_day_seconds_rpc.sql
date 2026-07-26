-- Atomic time-on-task increment. The day page heartbeat calls this every ~30s
-- of *visible* time; a read-modify-write from the client would race with the
-- autosave upsert, so the addition happens in SQL. SECURITY INVOKER: RLS on
-- day_state already scopes writes to the owner, and the WHERE narrows it again.
-- UPDATE-only on purpose — the first heartbeat before the autosave creates the
-- row just no-ops instead of inserting a skeleton row the hydration/no-downgrade
-- logic would then have to reason about.

CREATE OR REPLACE FUNCTION public.add_day_seconds(_day_id integer, _seconds integer)
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE public.day_state
     SET seconds_spent = seconds_spent + LEAST(GREATEST(_seconds, 0), 300)
   WHERE user_id = auth.uid() AND day_id = _day_id;
$$;

REVOKE ALL ON FUNCTION public.add_day_seconds(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_day_seconds(integer, integer) TO authenticated, service_role;
