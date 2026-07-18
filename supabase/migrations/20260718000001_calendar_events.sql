-- Calendar events move from hardcoded source to the DB so the teacher can
-- manage the schedule without a code deploy. Students read; coach/admin write.
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('europa', 'latam', 'taller', 'repos')),
  title TEXT NOT NULL,
  start_utc TIMESTAMPTZ NOT NULL,
  duration_min INT NOT NULL DEFAULT 90 CHECK (duration_min > 0),
  description TEXT,
  zoom_url TEXT,
  zoom_id TEXT,
  material_to TEXT,
  reference_times JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;
GRANT ALL ON public.calendar_events TO service_role;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read calendar events"
  ON public.calendar_events FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Coaches insert calendar events"
  ON public.calendar_events FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Coaches update calendar events"
  ON public.calendar_events FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Coaches delete calendar events"
  ON public.calendar_events FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON public.calendar_events (start_utc);

-- Seed with the schedule that was previously hardcoded in src/lib/calendarEvents.ts
-- (EUROPA 21:00 Paris = 19:00 UTC; LATAM 21:00 Bolivia = 01:00 UTC next day;
-- Taller 10:00 Bolivia = 14:00 UTC; repos week anchored Mon 00:00 UTC).
INSERT INTO public.calendar_events (kind, title, start_utc, duration_min, description, zoom_url, zoom_id, material_to, reference_times)
SELECT * FROM (VALUES
  ('europa', 'Clase EUROPA En vivo #1', '2026-07-13 19:00:00+00'::timestamptz, 90, 'Sesión 1 de 8. Nos vemos en Zoom para practicar en vivo.', 'https://us06web.zoom.us/j/86574307208', '865 7430 7208', '/clasesenvivo', '[{"flag":"🇫🇷","label":"France","time":"21:00"},{"flag":"🇨🇦/🇧🇴","label":"Québec / Bolivia","time":"15:00"},{"flag":"🇨🇴","label":"Colombia","time":"14:00"}]'::jsonb),
  ('europa', 'Clase EUROPA En vivo #2', '2026-07-15 19:00:00+00', 90, 'Sesión 2 de 8. Nos vemos en Zoom para practicar en vivo.', 'https://us06web.zoom.us/j/86574307208', '865 7430 7208', '/clasesenvivo', '[{"flag":"🇫🇷","label":"France","time":"21:00"},{"flag":"🇨🇦/🇧🇴","label":"Québec / Bolivia","time":"15:00"},{"flag":"🇨🇴","label":"Colombia","time":"14:00"}]'::jsonb),
  ('europa', 'Clase EUROPA En vivo #3', '2026-07-20 19:00:00+00', 90, 'Sesión 3 de 8. Nos vemos en Zoom para practicar en vivo.', 'https://us06web.zoom.us/j/86574307208', '865 7430 7208', '/clasesenvivo', '[{"flag":"🇫🇷","label":"France","time":"21:00"},{"flag":"🇨🇦/🇧🇴","label":"Québec / Bolivia","time":"15:00"},{"flag":"🇨🇴","label":"Colombia","time":"14:00"}]'::jsonb),
  ('europa', 'Clase EUROPA En vivo #4', '2026-07-22 19:00:00+00', 90, 'Sesión 4 de 8. Nos vemos en Zoom para practicar en vivo.', 'https://us06web.zoom.us/j/86574307208', '865 7430 7208', '/clasesenvivo', '[{"flag":"🇫🇷","label":"France","time":"21:00"},{"flag":"🇨🇦/🇧🇴","label":"Québec / Bolivia","time":"15:00"},{"flag":"🇨🇴","label":"Colombia","time":"14:00"}]'::jsonb),
  ('europa', 'Clase EUROPA En vivo #5', '2026-07-27 19:00:00+00', 90, 'Sesión 5 de 8. Nos vemos en Zoom para practicar en vivo.', 'https://us06web.zoom.us/j/86574307208', '865 7430 7208', '/clasesenvivo', '[{"flag":"🇫🇷","label":"France","time":"21:00"},{"flag":"🇨🇦/🇧🇴","label":"Québec / Bolivia","time":"15:00"},{"flag":"🇨🇴","label":"Colombia","time":"14:00"}]'::jsonb),
  ('europa', 'Clase EUROPA En vivo #6', '2026-07-29 19:00:00+00', 90, 'Sesión 6 de 8. Nos vemos en Zoom para practicar en vivo.', 'https://us06web.zoom.us/j/86574307208', '865 7430 7208', '/clasesenvivo', '[{"flag":"🇫🇷","label":"France","time":"21:00"},{"flag":"🇨🇦/🇧🇴","label":"Québec / Bolivia","time":"15:00"},{"flag":"🇨🇴","label":"Colombia","time":"14:00"}]'::jsonb),
  ('europa', 'Clase EUROPA En vivo #7', '2026-08-03 19:00:00+00', 90, 'Sesión 7 de 8. Nos vemos en Zoom para practicar en vivo.', 'https://us06web.zoom.us/j/86574307208', '865 7430 7208', '/clasesenvivo', '[{"flag":"🇫🇷","label":"France","time":"21:00"},{"flag":"🇨🇦/🇧🇴","label":"Québec / Bolivia","time":"15:00"},{"flag":"🇨🇴","label":"Colombia","time":"14:00"}]'::jsonb),
  ('europa', 'Clase EUROPA En vivo #8', '2026-08-05 19:00:00+00', 90, 'Sesión 8 de 8. Nos vemos en Zoom para practicar en vivo.', 'https://us06web.zoom.us/j/86574307208', '865 7430 7208', '/clasesenvivo', '[{"flag":"🇫🇷","label":"France","time":"21:00"},{"flag":"🇨🇦/🇧🇴","label":"Québec / Bolivia","time":"15:00"},{"flag":"🇨🇴","label":"Colombia","time":"14:00"}]'::jsonb),
  ('latam', 'Clase LATAM En vivo #1', '2026-07-15 01:00:00+00', 90, 'Sesión 1 de 8. Nos vemos en Zoom para practicar en vivo.', 'https://us06web.zoom.us/j/89051918151', '890 5191 8151', '/clasesenvivo', '[{"flag":"🇨🇦/🇧🇴","label":"Québec / Bolivia","time":"21:00"},{"flag":"🇨🇴","label":"Colombia","time":"20:00"}]'::jsonb),
  ('latam', 'Clase LATAM En vivo #2', '2026-07-17 01:00:00+00', 90, 'Sesión 2 de 8. Nos vemos en Zoom para practicar en vivo.', 'https://us06web.zoom.us/j/88268165745', '882 6816 5745', '/clasesenvivo', '[{"flag":"🇨🇦/🇧🇴","label":"Québec / Bolivia","time":"21:00"},{"flag":"🇨🇴","label":"Colombia","time":"20:00"}]'::jsonb),
  ('latam', 'Clase LATAM En vivo #3', '2026-07-22 01:00:00+00', 90, 'Sesión 3 de 8. Nos vemos en Zoom para practicar en vivo.', 'https://us06web.zoom.us/j/89051918151', '890 5191 8151', '/clasesenvivo', '[{"flag":"🇨🇦/🇧🇴","label":"Québec / Bolivia","time":"21:00"},{"flag":"🇨🇴","label":"Colombia","time":"20:00"}]'::jsonb),
  ('latam', 'Clase LATAM En vivo #4', '2026-07-24 01:00:00+00', 90, 'Sesión 4 de 8. Nos vemos en Zoom para practicar en vivo.', 'https://us06web.zoom.us/j/88268165745', '882 6816 5745', '/clasesenvivo', '[{"flag":"🇨🇦/🇧🇴","label":"Québec / Bolivia","time":"21:00"},{"flag":"🇨🇴","label":"Colombia","time":"20:00"}]'::jsonb),
  ('latam', 'Clase LATAM En vivo #5', '2026-07-29 01:00:00+00', 90, 'Sesión 5 de 8. Nos vemos en Zoom para practicar en vivo.', 'https://us06web.zoom.us/j/89051918151', '890 5191 8151', '/clasesenvivo', '[{"flag":"🇨🇦/🇧🇴","label":"Québec / Bolivia","time":"21:00"},{"flag":"🇨🇴","label":"Colombia","time":"20:00"}]'::jsonb),
  ('latam', 'Clase LATAM En vivo #6', '2026-07-31 01:00:00+00', 90, 'Sesión 6 de 8. Nos vemos en Zoom para practicar en vivo.', 'https://us06web.zoom.us/j/88268165745', '882 6816 5745', '/clasesenvivo', '[{"flag":"🇨🇦/🇧🇴","label":"Québec / Bolivia","time":"21:00"},{"flag":"🇨🇴","label":"Colombia","time":"20:00"}]'::jsonb),
  ('latam', 'Clase LATAM En vivo #7', '2026-08-05 01:00:00+00', 90, 'Sesión 7 de 8. Nos vemos en Zoom para practicar en vivo.', 'https://us06web.zoom.us/j/89051918151', '890 5191 8151', '/clasesenvivo', '[{"flag":"🇨🇦/🇧🇴","label":"Québec / Bolivia","time":"21:00"},{"flag":"🇨🇴","label":"Colombia","time":"20:00"}]'::jsonb),
  ('latam', 'Clase LATAM En vivo #8', '2026-08-07 01:00:00+00', 90, 'Sesión 8 de 8. Nos vemos en Zoom para practicar en vivo.', 'https://us06web.zoom.us/j/88268165745', '882 6816 5745', '/clasesenvivo', '[{"flag":"🇨🇦/🇧🇴","label":"Québec / Bolivia","time":"21:00"},{"flag":"🇨🇴","label":"Colombia","time":"20:00"}]'::jsonb),
  ('taller', 'Taller 1', '2026-07-18 14:00:00+00', 90, 'Taller especial en vivo. ¡Nos vemos en Zoom!', 'https://us06web.zoom.us/j/89546346403', '895 4634 6403', '/clasesenvivo', '[{"flag":"🇧🇴","label":"Bolivia","time":"10:00"},{"flag":"🇨🇴","label":"Colombia","time":"09:00"},{"flag":"🇫🇷","label":"France","time":"16:00"}]'::jsonb),
  ('repos', 'Semaine de repos 😴', '2026-08-10 00:00:00+00', 10080, NULL, NULL, NULL, NULL, NULL)
) AS seed(kind, title, start_utc, duration_min, description, zoom_url, zoom_id, material_to, reference_times)
WHERE NOT EXISTS (SELECT 1 FROM public.calendar_events);
