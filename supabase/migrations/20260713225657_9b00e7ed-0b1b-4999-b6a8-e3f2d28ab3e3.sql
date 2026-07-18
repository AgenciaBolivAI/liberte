
DROP TRIGGER IF EXISTS trg_award_day_stars ON public.day_completions;
CREATE TRIGGER trg_award_day_stars
AFTER INSERT ON public.day_completions
FOR EACH ROW EXECUTE FUNCTION public.award_day_stars();

DROP TRIGGER IF EXISTS trg_award_defi_stars ON public.defi_results;
CREATE TRIGGER trg_award_defi_stars
AFTER INSERT ON public.defi_results
FOR EACH ROW EXECUTE FUNCTION public.award_defi_stars();

-- Backfill any missing awards for existing progress
INSERT INTO public.star_awards (user_id, amount, reason, source_key)
SELECT user_id, 2, 'day_complete', 'day_complete:' || day_id
FROM public.day_completions
ON CONFLICT (user_id, source_key) DO NOTHING;

INSERT INTO public.star_awards (user_id, amount, reason, source_key)
SELECT user_id, 2, 'defi', 'defi:' || day_id
FROM public.defi_results
ON CONFLICT (user_id, source_key) DO NOTHING;
