-- Extend the 20260721000000 privilege hardening to the ~17 tables created BEFORE
-- it. Supabase's schema-wide default ACL had granted anon + authenticated the
-- full privilege set on every new public table, including TRUNCATE, TRIGGER and
-- REFERENCES. RLS gates SELECT/INSERT/UPDATE/DELETE at the ROW level, but
-- TRUNCATE ignores RLS entirely — so a broad TRUNCATE grant is the one that
-- actually matters. The REST API (PostgREST) never issues TRUNCATE/TRIGGER/
-- REFERENCES, so revoking exactly those three is a no-risk change: it closes the
-- RLS-bypass wipe vector and cleans the ACL, while leaving the RLS-gated CRUD the
-- app relies on completely intact.
--
-- Verified against the live DB (tpqoszkffdmxdyskdnyi): before this migration all
-- 17 tables below granted TRUNCATE to BOTH anon and authenticated.

REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.activity_results FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.calendar_events FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.day_completions FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.day_state FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.defi_results FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.email_send_log FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.email_send_state FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.email_unsubscribe_tokens FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.profiles FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.star_awards FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.suppressed_emails FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.tutor_conversations FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.tutor_usage FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.user_roles FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.week_state FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.week_unlocks FROM anon, authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.weekly_evaluations FROM anon, authenticated;
