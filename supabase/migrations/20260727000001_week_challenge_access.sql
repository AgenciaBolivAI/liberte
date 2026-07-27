-- ADMIN CONTROL OVER THE WEEKLY CHALLENGE ("reto final de la semana").
--
-- Until now `content_access` could only target a 'day' or a 'week', and a
-- 'week' + 'open' override means "this student may START the week's days
-- early" — deliberately NOT "may take the weekly evaluation", because that
-- would let a student with zero work submit a graded week (half-weight score
-- stored forever, +3 stars minted, teacher auto-messaged).
--
-- The teacher still needs explicit control over the challenge itself, so this
-- adds a THIRD target type, 'week_challenge' (target_id = week number), which
-- the weekly gate reads directly:
--   open   -> force-unlock the challenge for that student/everyone
--   locked -> force-lock it (students only; staff always pass)
--   (no row) -> the normal rule (reached the end of the week, or already
--               evaluated)
-- Keeping it a separate target type means "open the week early" and "open the
-- challenge" stay independent decisions instead of one ambiguous switch.

ALTER TABLE public.content_access
  DROP CONSTRAINT IF EXISTS content_access_target_type_check;
ALTER TABLE public.content_access
  ADD CONSTRAINT content_access_target_type_check
  CHECK (target_type IN ('day', 'week', 'week_challenge'));

ALTER TABLE public.content_access
  DROP CONSTRAINT IF EXISTS content_access_target_range;
ALTER TABLE public.content_access
  ADD CONSTRAINT content_access_target_range CHECK (
    (target_type = 'day' AND target_id BETWEEN 1 AND 120)
    OR (target_type = 'week' AND target_id BETWEEN 1 AND 24)
    OR (target_type = 'week_challenge' AND target_id BETWEEN 1 AND 24)
  );
