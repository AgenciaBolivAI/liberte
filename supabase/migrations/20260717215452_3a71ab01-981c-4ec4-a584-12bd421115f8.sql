
CREATE TABLE public.day_state (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_id INT NOT NULL,
  done_lessons JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_lesson TEXT,
  stars INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.day_state TO authenticated;
GRANT ALL ON public.day_state TO service_role;
ALTER TABLE public.day_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_day_state_select" ON public.day_state FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_day_state_insert" ON public.day_state FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_day_state_update" ON public.day_state FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_day_state_delete" ON public.day_state FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_day_state_updated_at BEFORE UPDATE ON public.day_state FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
