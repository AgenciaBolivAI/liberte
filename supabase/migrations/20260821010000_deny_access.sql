-- Denying an access request.
--
-- The approval queue only had "approve". An admin who did not want to let
-- someone in had no action at all: the request sat in the queue forever, and
-- the person waited on the "pending" screen with no answer. Deleting the
-- account was the only way to clear it, which is far more than "no".
--
-- `denied_at` is deliberately separate from `approved_at` (still NULL) so the
-- three states are distinguishable: waiting, denied, approved. Reversible —
-- approving later just clears it.

alter table public.profiles add column if not exists denied_at timestamptz;
alter table public.profiles add column if not exists denied_by uuid references auth.users (id) on delete set null;
alter table public.profiles add column if not exists denied_reason text;

create index if not exists profiles_denied_at_idx on public.profiles (denied_at) where denied_at is not null;
