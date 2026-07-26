-- Activity → notification fan-out, at the DATABASE level so every insert path
-- (client insert, server fn, admin import) produces the alert. Recipients:
-- the student's assigned teacher (profiles.assigned_coach) plus every admin —
-- the client asked for teacher AND admin visibility of each finished lesson.

CREATE OR REPLACE FUNCTION public.notify_student_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind text;
  v_payload jsonb;
  v_student uuid;
  v_name text;
BEGIN
  v_student := NEW.user_id;
  SELECT COALESCE(NULLIF(full_name, ''), email, 'Alumno/a') INTO v_name
    FROM public.profiles WHERE id = v_student;

  IF TG_TABLE_NAME = 'day_completions' THEN
    v_kind := 'day_completed';
    v_payload := jsonb_build_object('student_id', v_student, 'student_name', v_name,
                                    'day_id', NEW.day_id, 'week_number', NEW.week_number);
  ELSIF TG_TABLE_NAME = 'defi_results' THEN
    v_kind := 'defi_submitted';
    v_payload := jsonb_build_object('student_id', v_student, 'student_name', v_name,
                                    'day_id', NEW.day_id, 'score_10', NEW.score_10);
  ELSE
    v_kind := 'weekly_evaluated';
    v_payload := jsonb_build_object('student_id', v_student, 'student_name', v_name,
                                    'week_number', NEW.week_number, 'weekly_score', NEW.weekly_score);
  END IF;

  -- assigned teacher + all admins, deduped, never the student themself.
  INSERT INTO public.notifications (recipient_id, kind, payload)
  SELECT DISTINCT r.uid, v_kind, v_payload
  FROM (
    SELECT p.assigned_coach AS uid FROM public.profiles p
      WHERE p.id = v_student AND p.assigned_coach IS NOT NULL
    UNION
    SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'admin'
  ) r
  WHERE r.uid IS NOT NULL AND r.uid <> v_student;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_day_completion ON public.day_completions;
CREATE TRIGGER trg_notify_day_completion
  AFTER INSERT ON public.day_completions
  FOR EACH ROW EXECUTE FUNCTION public.notify_student_activity();

DROP TRIGGER IF EXISTS trg_notify_defi ON public.defi_results;
CREATE TRIGGER trg_notify_defi
  AFTER INSERT ON public.defi_results
  FOR EACH ROW EXECUTE FUNCTION public.notify_student_activity();

DROP TRIGGER IF EXISTS trg_notify_weekly ON public.weekly_evaluations;
CREATE TRIGGER trg_notify_weekly
  AFTER INSERT ON public.weekly_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.notify_student_activity();
