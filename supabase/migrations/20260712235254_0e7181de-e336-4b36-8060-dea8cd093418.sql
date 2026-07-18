
-- 1. Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS country_residence text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS objective text,
  ADD COLUMN IF NOT EXISTS mother_tongue text;

-- 2. Update handle_new_user to persist all signup fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  bd text;
  bd_date date;
BEGIN
  bd := NEW.raw_user_meta_data->>'birth_date';
  BEGIN
    bd_date := CASE WHEN bd IS NULL OR bd = '' THEN NULL ELSE bd::date END;
  EXCEPTION WHEN OTHERS THEN
    bd_date := NULL;
  END;

  INSERT INTO public.profiles (id, full_name, email, phone, nationality, country_residence, birth_date)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'nationality',
    NEW.raw_user_meta_data->>'country_residence',
    bd_date
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    nationality = COALESCE(EXCLUDED.nationality, public.profiles.nationality),
    country_residence = COALESCE(EXCLUDED.country_residence, public.profiles.country_residence),
    birth_date = COALESCE(EXCLUDED.birth_date, public.profiles.birth_date);
  RETURN NEW;
END;
$function$;

-- 3. star_awards table
CREATE TABLE IF NOT EXISTS public.star_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL DEFAULT 1,
  reason text NOT NULL,
  source_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_key)
);
GRANT SELECT, INSERT ON public.star_awards TO authenticated;
GRANT ALL ON public.star_awards TO service_role;
ALTER TABLE public.star_awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own stars" ON public.star_awards
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own stars" ON public.star_awards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_star_awards_user_created ON public.star_awards(user_id, created_at DESC);

-- 4. day_completions table
CREATE TABLE IF NOT EXISTS public.day_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_id integer NOT NULL,
  week_number integer NOT NULL DEFAULT 1,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day_id)
);
GRANT SELECT, INSERT, DELETE ON public.day_completions TO authenticated;
GRANT ALL ON public.day_completions TO service_role;
ALTER TABLE public.day_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own day completions" ON public.day_completions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own day completions" ON public.day_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own day completions" ON public.day_completions
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Award 2 stars automatically on défi completion (idempotent)
CREATE OR REPLACE FUNCTION public.award_defi_stars()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.star_awards (user_id, amount, reason, source_key)
  VALUES (NEW.user_id, 2, 'defi', 'defi:' || NEW.day_id)
  ON CONFLICT (user_id, source_key) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_defi_stars ON public.defi_results;
CREATE TRIGGER trg_award_defi_stars
  AFTER INSERT ON public.defi_results
  FOR EACH ROW EXECUTE FUNCTION public.award_defi_stars();

-- 6. Award 2 bonus stars when a day is marked as completed
CREATE OR REPLACE FUNCTION public.award_day_stars()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.star_awards (user_id, amount, reason, source_key)
  VALUES (NEW.user_id, 2, 'day_complete', 'day_complete:' || NEW.day_id)
  ON CONFLICT (user_id, source_key) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_day_stars ON public.day_completions;
CREATE TRIGGER trg_award_day_stars
  AFTER INSERT ON public.day_completions
  FOR EACH ROW EXECUTE FUNCTION public.award_day_stars();

-- 7. Backfill defi stars for existing users (best-effort)
INSERT INTO public.star_awards (user_id, amount, reason, source_key)
SELECT DISTINCT user_id, 2, 'defi', 'defi:' || day_id
FROM public.defi_results
ON CONFLICT (user_id, source_key) DO NOTHING;
