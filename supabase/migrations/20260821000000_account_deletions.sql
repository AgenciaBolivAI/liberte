-- Audit trail for permanently deleted accounts.
--
-- Deleting a student cascades every row they own out of the database, so
-- afterwards there is nothing left to say who was removed, by whom, or why.
-- This table is deliberately NOT linked to auth.users: it has to outlive the
-- account it describes.

create table if not exists public.account_deletions (
  id uuid primary key default gen_random_uuid(),
  -- Copies, not references: the user is gone.
  deleted_user_id uuid not null,
  email text,
  full_name text,
  reason text,
  -- What was destroyed, captured before the delete so the record is meaningful.
  days_completed int not null default 0,
  stars int not null default 0,
  deleted_by uuid references auth.users (id) on delete set null,
  deleted_by_email text,
  created_at timestamptz not null default now()
);

create index if not exists account_deletions_created_at_idx
  on public.account_deletions (created_at desc);

alter table public.account_deletions enable row level security;

-- Admins can read the log. Writes only ever happen through the service role in
-- deleteStudentAccount, so no insert/update/delete policy is granted to anyone.
drop policy if exists "admins read account deletions" on public.account_deletions;
create policy "admins read account deletions"
  on public.account_deletions
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));
