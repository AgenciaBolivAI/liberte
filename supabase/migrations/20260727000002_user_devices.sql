-- Device analytics: how many users are on desktop vs mobile (admin request).
-- One row per (user, device kind); `visits` counts sessions, `last_seen` lets
-- the admin analytics answer "per device, in this date range".

CREATE TABLE IF NOT EXISTS public.user_devices (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device text NOT NULL CHECK (device IN ('desktop', 'mobile', 'tablet')),
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  visits integer NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, device)
);

CREATE INDEX IF NOT EXISTS user_devices_last_seen_idx ON public.user_devices (last_seen DESC);

-- Students never write this table directly: the RPC below is the only path
-- (same hardening shape as tutor_consume_message), so nobody can forge another
-- user's device rows or inflate visit counts for someone else.
GRANT SELECT ON public.user_devices TO authenticated;
GRANT ALL ON public.user_devices TO service_role;

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own devices read" ON public.user_devices;
CREATE POLICY "own devices read"
  ON public.user_devices FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "staff devices read" ON public.user_devices;
CREATE POLICY "staff devices read"
  ON public.user_devices FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'coach'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Atomic upsert for the signed-in user only. SECURITY DEFINER + auth.uid()
-- pinning means the caller cannot choose whose row is written.
CREATE OR REPLACE FUNCTION public.record_device(_device text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  IF _device NOT IN ('desktop', 'mobile', 'tablet') THEN RETURN; END IF;
  INSERT INTO public.user_devices (user_id, device)
  VALUES (auth.uid(), _device)
  ON CONFLICT (user_id, device) DO UPDATE
    SET last_seen = now(),
        visits = public.user_devices.visits + 1;
END;
$$;

REVOKE ALL ON FUNCTION public.record_device(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_device(text) TO authenticated, service_role;
