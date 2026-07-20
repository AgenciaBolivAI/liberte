-- Pre-launch security hardening (audit findings H1, M1).

-- H1(a): the daily tutor cap was a caller-supplied parameter, so a student
-- could call the RPC with _limit = 999999999 and bypass it. Hardcode the cap
-- inside the function; keep the signature so the app's existing call still
-- resolves, but ignore whatever value it passes.
CREATE OR REPLACE FUNCTION public.tutor_consume_message(_limit INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_count INT;
  cap CONSTANT INT := 30;  -- authoritative limit; _limit is ignored
BEGIN
  INSERT INTO public.tutor_usage (user_id, usage_date, message_count)
  VALUES (auth.uid(), (now() AT TIME ZONE 'utc')::date, 1)
  ON CONFLICT (user_id, usage_date) DO UPDATE
    SET message_count = public.tutor_usage.message_count + 1
    WHERE public.tutor_usage.message_count < cap
  RETURNING message_count INTO new_count;
  RETURN new_count;
END;
$$;

-- H1(b): tutor_usage was directly writable by the student, so they could reset
-- their own counter to 0. All writes now go through the SECURITY DEFINER RPC
-- above (which runs as owner); students need only to read their own row.
DROP POLICY IF EXISTS "own_tutor_usage_insert" ON public.tutor_usage;
DROP POLICY IF EXISTS "own_tutor_usage_update" ON public.tutor_usage;
REVOKE INSERT, UPDATE ON public.tutor_usage FROM authenticated;

-- M1: defi_results and weekly_evaluations hold AI-computed scores that fire
-- star-award triggers. They were directly insertable by the student (own-row
-- policy), which let a student mint stars by inserting self-scored rows. These
-- tables are now written ONLY by the grading server functions via the service
-- role; students may read their own rows but not write them.
REVOKE INSERT, UPDATE, DELETE ON public.defi_results FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.weekly_evaluations FROM authenticated;
