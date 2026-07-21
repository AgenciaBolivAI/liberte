-- Teacher content authoring (TEACH-1 v1). Staff create lesson DAYS (11-120)
-- made of typed BLOCKS (video, text, vocab, quiz, writing, speaking, file,
-- link). Days 1-10 stay code-authored; authored days extend the program without
-- a developer. Students see published days only; staff see drafts too (RLS).

CREATE TABLE IF NOT EXISTS public.authored_days (
  day_id INT PRIMARY KEY CHECK (day_id BETWEEN 11 AND 120),
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.authored_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id INT NOT NULL REFERENCES public.authored_days(day_id) ON DELETE CASCADE,
  sort INT NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('video','text','vocab','quiz','writing','speaking','file','link')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS authored_blocks_day_idx ON public.authored_blocks (day_id, sort);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.authored_days TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.authored_blocks TO authenticated;
GRANT ALL ON public.authored_days TO service_role;
GRANT ALL ON public.authored_blocks TO service_role;
ALTER TABLE public.authored_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authored_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read published or staff days" ON public.authored_days;
CREATE POLICY "read published or staff days"
  ON public.authored_days FOR SELECT TO authenticated
  USING (
    status = 'published'
    OR public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "staff write days" ON public.authored_days;
CREATE POLICY "staff write days"
  ON public.authored_days FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "read blocks of visible days" ON public.authored_blocks;
CREATE POLICY "read blocks of visible days"
  ON public.authored_blocks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.authored_days d
      WHERE d.day_id = authored_blocks.day_id
        AND (d.status = 'published'
          OR public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'))
    )
  );

DROP POLICY IF EXISTS "staff write blocks" ON public.authored_blocks;
CREATE POLICY "staff write blocks"
  ON public.authored_blocks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS authored_days_updated_at ON public.authored_days;
CREATE TRIGGER authored_days_updated_at
  BEFORE UPDATE ON public.authored_days
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS authored_blocks_updated_at ON public.authored_blocks;
CREATE TRIGGER authored_blocks_updated_at
  BEFORE UPDATE ON public.authored_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public bucket for teacher-uploaded course assets (slides, PDFs, images,
-- audio). Same visibility model as lesson content (which ships in the client
-- bundle); write access is staff-only.
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-assets', 'content-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "staff upload content assets" ON storage.objects;
CREATE POLICY "staff upload content assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'content-assets'
    AND (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'))
  );

DROP POLICY IF EXISTS "staff manage content assets" ON storage.objects;
CREATE POLICY "staff manage content assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'content-assets'
    AND (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'))
  );
