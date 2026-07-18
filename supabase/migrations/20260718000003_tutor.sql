-- AI conversation tutor: one active conversation per student (resettable),
-- plus a per-day message counter that enforces the server-side cost cap.

CREATE TABLE IF NOT EXISTS public.tutor_conversations (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  day_id INT NOT NULL DEFAULT 1 CHECK (day_id BETWEEN 1 AND 10),
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_conversations TO authenticated;
GRANT ALL ON public.tutor_conversations TO service_role;
ALTER TABLE public.tutor_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_tutor_conversations_select" ON public.tutor_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_tutor_conversations_insert" ON public.tutor_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_tutor_conversations_update" ON public.tutor_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_tutor_conversations_delete" ON public.tutor_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_tutor_conversations_updated_at BEFORE UPDATE ON public.tutor_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.tutor_usage (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  message_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, usage_date)
);
GRANT SELECT, INSERT, UPDATE ON public.tutor_usage TO authenticated;
GRANT ALL ON public.tutor_usage TO service_role;
ALTER TABLE public.tutor_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_tutor_usage_select" ON public.tutor_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_tutor_usage_insert" ON public.tutor_usage FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_tutor_usage_update" ON public.tutor_usage FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read tutor usage" ON public.tutor_usage FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_tutor_usage_updated_at BEFORE UPDATE ON public.tutor_usage FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
