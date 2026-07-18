
-- activity_results: per-activity correction records used by the weekly summary
CREATE TABLE public.activity_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  day_id INTEGER NOT NULL,
  section TEXT NOT NULL CHECK (section IN ('vocab','cles')),
  competence TEXT NOT NULL CHECK (competence IN ('PE','PO','CE','CO')),
  item_index INTEGER NOT NULL DEFAULT 0,
  prompt TEXT NOT NULL DEFAULT '',
  expected TEXT NOT NULL DEFAULT '',
  response TEXT NOT NULL DEFAULT '',
  resultado TEXT NOT NULL DEFAULT 'parcial',
  score NUMERIC NOT NULL DEFAULT 0,
  aciertos JSONB NOT NULL DEFAULT '[]'::jsonb,
  errores JSONB NOT NULL DEFAULT '[]'::jsonb,
  punto_debil TEXT NOT NULL DEFAULT '',
  practica_recomendada TEXT NOT NULL DEFAULT '',
  feedback_alumno TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_results TO authenticated;
GRANT ALL ON public.activity_results TO service_role;

ALTER TABLE public.activity_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own activity results: read"
  ON public.activity_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'coach') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Own activity results: insert"
  ON public.activity_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Own activity results: update"
  ON public.activity_results FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX activity_results_user_day_idx ON public.activity_results (user_id, day_id);

-- Extend weekly summary to include activity_results alongside defi_results
CREATE OR REPLACE FUNCTION public.get_week_defi_summary(_user_id uuid, _from_day integer, _to_day integer)
RETURNS TABLE(
  days_completed integer,
  total_hits integer,
  total_misses integer,
  avg_score numeric,
  strengths jsonb,
  errors jsonb,
  weak_points jsonb,
  recommendations jsonb
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH defi AS (
    SELECT day_id, score_10, hits, misses, strengths, errors, weak_points, recommendation
    FROM public.defi_results
    WHERE user_id = _user_id AND day_id BETWEEN _from_day AND _to_day
  ),
  acts AS (
    SELECT day_id, score, aciertos, errores, punto_debil, practica_recomendada
    FROM public.activity_results
    WHERE user_id = _user_id AND day_id BETWEEN _from_day AND _to_day
  ),
  defi_agg AS (
    SELECT
      COUNT(*)::int AS days_completed,
      COALESCE(SUM(hits),0)::int AS d_hits,
      COALESCE(SUM(misses),0)::int AS d_misses,
      COALESCE(AVG(score_10),0)::numeric AS d_avg,
      COALESCE(jsonb_agg(strengths) FILTER (WHERE jsonb_array_length(strengths)>0),'[]'::jsonb) AS d_strengths,
      COALESCE(jsonb_agg(errors) FILTER (WHERE jsonb_array_length(errors)>0),'[]'::jsonb) AS d_errors,
      COALESCE(jsonb_agg(weak_points) FILTER (WHERE jsonb_array_length(weak_points)>0),'[]'::jsonb) AS d_weak,
      COALESCE(jsonb_agg(recommendation) FILTER (WHERE recommendation IS NOT NULL),'[]'::jsonb) AS d_recs
    FROM defi
  ),
  acts_agg AS (
    SELECT
      COALESCE(SUM(CASE WHEN score >= 7 THEN 1 ELSE 0 END),0)::int AS a_hits,
      COALESCE(SUM(CASE WHEN score < 7 THEN 1 ELSE 0 END),0)::int AS a_misses,
      COALESCE(AVG(score),0)::numeric AS a_avg,
      COALESCE(jsonb_agg(aciertos) FILTER (WHERE jsonb_array_length(aciertos)>0),'[]'::jsonb) AS a_strengths,
      COALESCE(jsonb_agg(errores) FILTER (WHERE jsonb_array_length(errores)>0),'[]'::jsonb) AS a_errors,
      COALESCE(jsonb_agg(to_jsonb(punto_debil)) FILTER (WHERE punto_debil <> ''),'[]'::jsonb) AS a_weak,
      COALESCE(jsonb_agg(to_jsonb(practica_recomendada)) FILTER (WHERE practica_recomendada <> ''),'[]'::jsonb) AS a_recs
    FROM acts
  )
  SELECT
    d.days_completed,
    (d.d_hits + a.a_hits)::int AS total_hits,
    (d.d_misses + a.a_misses)::int AS total_misses,
    CASE
      WHEN d.d_avg > 0 AND a.a_avg > 0 THEN ROUND(((d.d_avg + a.a_avg)/2)::numeric, 1)
      WHEN d.d_avg > 0 THEN ROUND(d.d_avg::numeric, 1)
      ELSE ROUND(a.a_avg::numeric, 1)
    END AS avg_score,
    (d.d_strengths || a.a_strengths) AS strengths,
    (d.d_errors || a.a_errors) AS errors,
    (d.d_weak || a.a_weak) AS weak_points,
    (d.d_recs || a.a_recs) AS recommendations
  FROM defi_agg d, acts_agg a;
$$;
