-- The daily tutor cap was read-then-write, so parallel requests could both
-- pass the check and exceed the limit. This does the check and the increment
-- in one atomic statement and returns the new count (NULL when over cap).
CREATE OR REPLACE FUNCTION public.tutor_consume_message(_limit INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_count INT;
BEGIN
  INSERT INTO public.tutor_usage (user_id, usage_date, message_count)
  VALUES (auth.uid(), (now() AT TIME ZONE 'utc')::date, 1)
  ON CONFLICT (user_id, usage_date) DO UPDATE
    SET message_count = public.tutor_usage.message_count + 1
    WHERE public.tutor_usage.message_count < _limit
  RETURNING message_count INTO new_count;
  -- No row returned => the WHERE blocked the update => cap reached.
  RETURN new_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.tutor_consume_message(INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tutor_consume_message(INT) TO authenticated, service_role;
