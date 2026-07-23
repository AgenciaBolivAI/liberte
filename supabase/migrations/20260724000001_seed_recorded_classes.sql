-- Seed the real built-in recorded classes into public.recorded_classes.
--
-- WHY: "En direct" showed a hardcoded built-in list (RECORDED_CLASSES in
-- clasesenvivo.index.tsx) ONLY while the table was empty
-- (`recordedClasses = dbClasses ?? RECORDED_CLASSES`). The moment staff added
-- their first class, the page switched to the DB list — which contained only the
-- new row — so the built-in classes appeared to "disappear". Nothing was
-- deleted; they were just hidden. Seeding the real built-ins makes the table the
-- single source of truth so "Añadir clase" ADDS to them instead of replacing.
--
-- Only the 3 classes that actually have replay links are seeded (the other
-- built-in entries were "Próximamente / Por confirmar" placeholders, not real
-- classes). Idempotent: each insert is skipped if a row with the same title
-- already exists, so re-running never duplicates and never disturbs
-- staff-added rows.

INSERT INTO public.recorded_classes (number, title, date_label, video_url, sort)
SELECT 1, 'Clase Europa #1', '13 de julio', 'https://fathom.video/share/puz62HVHjw4z5rxVtthvTD3BxmWnuvBZ', 1
WHERE NOT EXISTS (SELECT 1 FROM public.recorded_classes WHERE title = 'Clase Europa #1');

INSERT INTO public.recorded_classes (number, title, date_label, video_url, sort)
SELECT 1, 'Clase Latam #1', '13 de julio', 'https://fathom.video/share/mRN6oHue1g6c1Xy7B2RPowyaFPFdnKCA', 2
WHERE NOT EXISTS (SELECT 1 FROM public.recorded_classes WHERE title = 'Clase Latam #1');

INSERT INTO public.recorded_classes (number, title, date_label, video_url, sort)
SELECT 2, 'Clase Europa #2', '15 de julio', 'https://fathom.video/share/TiL-9or41myitN_bsuKuk9Q5XfKf4_zd', 3
WHERE NOT EXISTS (SELECT 1 FROM public.recorded_classes WHERE title = 'Clase Europa #2');
