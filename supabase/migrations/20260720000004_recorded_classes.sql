-- Recorded live-class replays, managed by staff from the admin panel instead of
-- being hardcoded in clasesenvivo.index.tsx. Students read; staff write (RLS).

CREATE TABLE IF NOT EXISTS public.recorded_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INT NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  date_label TEXT NOT NULL DEFAULT '',
  video_url TEXT,
  sort INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recorded_classes TO authenticated;
GRANT ALL ON public.recorded_classes TO service_role;
ALTER TABLE public.recorded_classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students read recorded classes" ON public.recorded_classes;
CREATE POLICY "students read recorded classes"
  ON public.recorded_classes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "staff write recorded classes" ON public.recorded_classes;
CREATE POLICY "staff write recorded classes"
  ON public.recorded_classes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS recorded_classes_updated_at ON public.recorded_classes;
CREATE TRIGGER recorded_classes_updated_at
  BEFORE UPDATE ON public.recorded_classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
