-- "Le Petit Plus Liberté" — the weekly bonus videos — become teacher-editable.
--
-- Client: "No puedo editar la parte de Bonus que está dentro de cada semana. Se
-- llama 'Le Petit plus Liberté'. No hay donde cambiar ahí los videitos."
--
-- They were a hardcoded array inside a route module (PLUS_RESOURCES_BY_WEEK in
-- src/routes/plus.$weekId.$itemId.tsx), compiled into the JS bundle, so changing
-- a video needed a developer and a redeploy. Same shape/grants/RLS as
-- recorded_classes (20260720000004), which exists for exactly this reason.
--
-- The student UI keeps reading the code array as a fallback whenever the table has
-- no rows for a week, so nothing breaks before the teacher saves anything.

CREATE TABLE IF NOT EXISTS public.plus_resources (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week        int  NOT NULL,
  emoji       text NOT NULL DEFAULT '✨',
  eyebrow     text NOT NULL DEFAULT '',
  title       text NOT NULL,
  subtitle    text NOT NULL DEFAULT '',
  note        text,
  -- Bare 11-char YouTube id, matching what the player embeds today. The editor
  -- accepts any pasted YouTube URL and extracts this.
  youtube_id  text NOT NULL,
  sort        int  NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plus_resources_week_sort_idx ON public.plus_resources (week, sort);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plus_resources TO authenticated;
GRANT ALL ON public.plus_resources TO service_role;
ALTER TABLE public.plus_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students read plus resources" ON public.plus_resources;
CREATE POLICY "students read plus resources" ON public.plus_resources
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "staff write plus resources" ON public.plus_resources;
CREATE POLICY "staff write plus resources" ON public.plus_resources
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_plus_resources_updated_at ON public.plus_resources;
CREATE TRIGGER update_plus_resources_updated_at
  BEFORE UPDATE ON public.plus_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
