-- Admin approval gate: new accounts see a "pending" screen until an admin
-- approves them. Existing accounts are grandfathered in the same migration.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Grandfather every account that exists at migration time (CRITICAL: without
-- this, current students would be locked out).
UPDATE public.profiles SET approved_at = now() WHERE approved_at IS NULL;

-- Self-approval hardening. A plain column-level REVOKE would NOT work here:
-- Postgres column privileges are additive to table-level ones, so we revoke
-- the table-level write grants and re-grant UPDATE scoped to exactly the
-- columns the app's profile editor writes. Approval writes go through a
-- service-role server function only. handle_new_user is SECURITY DEFINER
-- (owner) so signup profile creation is unaffected.
REVOKE INSERT, UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone, nationality, country_residence, birth_date, objective, mother_tongue, avatar_url)
  ON public.profiles TO authenticated;
