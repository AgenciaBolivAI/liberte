-- Hardening pass for the 7 tables added in 20260720000000-20260720000005.
--
-- This Supabase project has a schema-wide default ACL (standard Supabase
-- provisioning, set up before any of our migrations ran) that auto-grants
-- full CRUD (arwdDxtm — select/insert/update/delete/truncate/references/
-- trigger) to BOTH `anon` and `authenticated` on every new table created in
-- `public`. Our migrations' own GRANT lines only ADD to that — they never
-- overrode it. RLS still blocked most of the resulting over-grant (no
-- permissive policy existed for the extra commands), but two real gaps
-- remained: (1) `messages` had a genuinely permissive row-scoped UPDATE
-- policy with no column restriction, so a recipient could rewrite a
-- message's body/sender via the table-wide UPDATE grant; (2) TRUNCATE is
-- never filtered by RLS (it isn't one of the RLS-checked commands), so
-- every one of these tables was TRUNCATE-able by any authenticated user
-- and even `anon`, regardless of policies.
--
-- Fix: revoke everything from anon/authenticated on each table, then
-- re-grant exactly what each table's application code and RLS design need.

-- content_access: student reads (SELECT); writes go through the service role
-- from the app, but the "staff write" RLS policy is intentional defense in
-- depth for a staff member connecting with their own session, so INSERT/
-- UPDATE/DELETE are granted (RLS still confines them to staff). No TRUNCATE.
REVOKE ALL ON public.content_access FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_access TO authenticated;

-- messages: SELECT + INSERT are genuinely used by the app (own-session
-- client); UPDATE is column-scoped to read_at only (read receipts). No
-- DELETE (no delete policy exists — history is permanent), no TRUNCATE.
REVOKE ALL ON public.messages FROM anon, authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT UPDATE (read_at) ON public.messages TO authenticated;

-- tutor_events: read-only for students/staff (own or staff, via RLS); all
-- writes are service-role only (so a student can't forge their own record).
REVOKE ALL ON public.tutor_events FROM anon, authenticated;
GRANT SELECT ON public.tutor_events TO authenticated;

-- recorded_classes: everyone reads; staff write directly with their own
-- session (ContentManager/RecordedClassesManager use the plain client), so
-- INSERT/UPDATE/DELETE are real requirements, gated by the staff-only RLS
-- policy. No TRUNCATE.
REVOKE ALL ON public.recorded_classes FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recorded_classes TO authenticated;

-- authored_days / authored_blocks: same pattern — the teacher authoring UI
-- writes directly with its own session; RLS confines writes to staff and
-- reads to published rows (or staff).
REVOKE ALL ON public.authored_days FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.authored_days TO authenticated;
REVOKE ALL ON public.authored_blocks FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.authored_blocks TO authenticated;

-- telegram_reminders: service-role only, by design (no RLS policies exist at
-- all for this table). Neither anon nor authenticated need any privilege.
REVOKE ALL ON public.telegram_reminders FROM anon, authenticated;
