-- CROSS-DEVICE PROGRESS LOSS (client: "cuando abro la sesión en otra computadora,
-- o en el celular, no reconoce el avance que ya tenía en el otro dispositivo…
-- aparece 80% en la compu y 20% en el celu").
--
-- The day page autosaved with a plain upsert that REPLACED done_lessons with the
-- tab's local array. Two sessions of the same student (phone + laptop, or a tab
-- left open since yesterday) each hold their own snapshot, so whichever writes
-- last wins and can SHRINK the saved set. The client-side no-downgrade rule only
-- blocked the empty→non-empty case, so a device holding 1 lesson happily
-- overwrote a row holding 4.
--
-- Fix: never let a write shrink progress. done_lessons is append-only by design
-- (the only client mutation is `setDone(d => ({...d, [k]: true}))`, and nothing
-- ever resets a day), so merging device states as a UNION is always correct and
-- makes the autosave commutative — order of arrival stops mattering.
--
-- stars: GREATEST, they only ever accrue.
-- current_lesson: last write wins on purpose — "where the student is now" is
-- inherently per-device and the most recent position is the useful one.
-- seconds_spent: untouched here; add_day_seconds owns it.
--
-- SECURITY INVOKER + auth.uid(): RLS on day_state already scopes to the owner,
-- and every statement below narrows to auth.uid() again, so a caller can only
-- ever merge their own row.

CREATE OR REPLACE FUNCTION public.merge_day_state(
  _day_id integer,
  _done_lessons text[],
  _current_lesson text,
  _stars integer
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.day_state AS ds (user_id, day_id, done_lessons, current_lesson, stars)
  VALUES (
    auth.uid(),
    _day_id,
    COALESCE(
      (SELECT jsonb_agg(DISTINCT k) FROM unnest(COALESCE(_done_lessons, '{}')) AS k),
      '[]'::jsonb
    ),
    _current_lesson,
    GREATEST(COALESCE(_stars, 0), 0)
  )
  ON CONFLICT (user_id, day_id) DO UPDATE
     SET done_lessons = COALESCE(
           (
             SELECT jsonb_agg(DISTINCT k)
               FROM (
                 SELECT jsonb_array_elements_text(ds.done_lessons) AS k
                 UNION
                 SELECT unnest(COALESCE(_done_lessons, '{}')) AS k
               ) merged
           ),
           '[]'::jsonb
         ),
         current_lesson = COALESCE(EXCLUDED.current_lesson, ds.current_lesson),
         stars = GREATEST(ds.stars, EXCLUDED.stars);
END;
$$;

REVOKE ALL ON FUNCTION public.merge_day_state(integer, text[], text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.merge_day_state(integer, text[], text, integer) TO authenticated, service_role;
