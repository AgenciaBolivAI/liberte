-- Roles system
CREATE TYPE public.app_role AS ENUM ('student', 'coach', 'admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Défi results
CREATE TABLE public.defi_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_id int NOT NULL,
  score_10 numeric(4,1) NOT NULL DEFAULT 0,
  hits int NOT NULL DEFAULT 0,
  misses int NOT NULL DEFAULT 0,
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  weak_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendation text,
  celebration_message text,
  stages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.defi_results TO authenticated;
GRANT ALL ON public.defi_results TO service_role;

ALTER TABLE public.defi_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own defi results" ON public.defi_results
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches read all defi results" ON public.defi_results
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER defi_results_updated_at
  BEFORE UPDATE ON public.defi_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX defi_results_user_day_idx ON public.defi_results (user_id, day_id);

-- Coaches also need to read profiles to render the roster
CREATE POLICY "Coaches read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));

-- Weekly summary aggregate
CREATE OR REPLACE FUNCTION public.get_week_defi_summary(_user_id uuid, _from_day int, _to_day int)
RETURNS TABLE (
  days_completed int,
  total_hits int,
  total_misses int,
  avg_score numeric,
  strengths jsonb,
  errors jsonb,
  weak_points jsonb,
  recommendations jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::int AS days_completed,
    COALESCE(SUM(hits), 0)::int AS total_hits,
    COALESCE(SUM(misses), 0)::int AS total_misses,
    COALESCE(AVG(score_10), 0)::numeric AS avg_score,
    COALESCE(jsonb_agg(strengths) FILTER (WHERE jsonb_array_length(strengths) > 0), '[]'::jsonb) AS strengths,
    COALESCE(jsonb_agg(errors) FILTER (WHERE jsonb_array_length(errors) > 0), '[]'::jsonb) AS errors,
    COALESCE(jsonb_agg(weak_points) FILTER (WHERE jsonb_array_length(weak_points) > 0), '[]'::jsonb) AS weak_points,
    COALESCE(jsonb_agg(recommendation) FILTER (WHERE recommendation IS NOT NULL), '[]'::jsonb) AS recommendations
  FROM public.defi_results
  WHERE user_id = _user_id
    AND day_id BETWEEN _from_day AND _to_day;
$$;
