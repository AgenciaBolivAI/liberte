# Migration runbook — moving to a new Supabase project

How to rebuild this app's database on a fresh Supabase project and carry every
student across, including their passwords.

Current source project: `erhirgyryiymlrjsivtb`

---

## What you need to collect

Get these before starting. The first two are the ones that decide whether
students keep their passwords.

| Item | Where | Why |
|---|---|---|
| **New project's database password** | Set when creating the project. If lost: Settings → Database → Reset database password | Lets me apply migrations and import `auth.users` **with password hashes** |
| **Source project's database password** | Same place, on `erhirgyryiymlrjsivtb` | Needed to export password hashes; without it every student must reset |
| New project ref / URL | Settings → API | App config |
| New publishable (anon) key | Settings → API | App config |
| New service-role key | Settings → API | Server functions, admin analytics |

Also keep `OPENAI_API_KEY`, and `RESEND_API_KEY` when it exists.

> **If neither database password is available**, the migration still works, but
> students cannot keep their passwords — they log in once via
> "¿Olvidaste tu contraseña?". Everything else (progress, stars, results,
> conversations) transfers intact, since `profiles.id` is the auth user id and
> the ids are preserved.

---

## Step 1 — Create the project

Create the new Supabase project. Choose a region close to the students
(`us-east-2` or a South American region). **Write down the database password.**

---

## Step 2 — Apply the schema

All 29 migrations in `supabase/migrations/` rebuild the schema from nothing.
They are applied in filename order.

```bash
supabase link --project-ref <NEW_REF>
supabase db push
```

Or paste each file, in order, into the dashboard SQL editor.

Three things were fixed on 18 July so this actually works on an empty database:

- `20260708192642` guarded two `REVOKE`s on functions Lovable creates
  out-of-band — previously this aborted the whole run
- `20260710203551` (a "wipe all test data" reset) is **neutered**; re-running it
  after import would delete every student
- `20260718000007` creates the `avatars` storage bucket and its policies, which
  had only ever been made by hand

---

## Step 3 — Export the current data

```bash
node scripts/export-db.mjs
```

Writes `db-export/` (gitignored — it contains student PII):

- `import.sql` — every public table as INSERTs, in foreign-key order, with
  triggers disabled so star awards don't double-fire
- `<table>.json` — raw rows, for inspection
- `auth-users.json` — user records **without** password hashes
- `storage-manifest.json` — every stored file with a 7-day signed URL
- `MANIFEST.md` — row counts

Run this **at cutover**, not in advance: students generate data daily.

---

## Step 4 — Carry the accounts across

### With the source database password (keeps passwords)

```bash
# Export auth users + identities, data only
pg_dump "postgresql://postgres.<SRC_REF>:<PW>@aws-1-<region>.pooler.supabase.com:5432/postgres" \
  --data-only -t auth.users -t auth.identities -f auth-data.sql

# Load into the new project
psql "postgresql://postgres.<NEW_REF>:<PW>@aws-1-<region>.pooler.supabase.com:5432/postgres" \
  -c "SET session_replication_role = replica;" -f auth-data.sql
```

Portable PostgreSQL 18 client tools (no admin install needed):
<https://get.enterprisedb.com/postgresql/postgresql-18.4-1-windows-x64-binaries.zip>
— unzip and use `pgsql/bin/`.

### Without it (students reset their passwords)

Recreate each account from `auth-users.json` via the Admin API, **preserving the
`id`** so all foreign keys still line up, then email everyone to use
"¿Olvidaste tu contraseña?" once. The reset flow is already built.

---

## Step 5 — Import the app data

Run `db-export/import.sql` against the new project (SQL editor or `psql`).
It sets `session_replication_role = replica` first, so the star/défi triggers
don't fire and double-award during import, and restores it at the end.

Order matters: **schema (step 2) → auth users (step 4) → app data (step 5)**.

---

## Step 6 — Storage

`storage-manifest.json` lists every file with a signed URL. Download and
re-upload to the same bucket and path — the paths are
`avatars/<user_id>/avatar.jpg`, and `profiles.avatar_url` points at them, so
keeping the path identical means nothing else needs changing.

---

## Step 7 — Point the app at the new project

Update `.env`:

```
SUPABASE_PROJECT_ID="<NEW_REF>"
SUPABASE_URL="https://<NEW_REF>.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
VITE_SUPABASE_PROJECT_ID="<NEW_REF>"
VITE_SUPABASE_URL="https://<NEW_REF>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
```

`SUPABASE_URL` must be the **API URL** (`https://<ref>.supabase.co`), not the
database host (`db.<ref>.supabase.co`) — the app builds its client from it.

Then set the same values on the host (Vercel/Cloudflare). Remember the `VITE_`
ones are **baked in at build time**: they must exist wherever the build runs, or
the browser bundle ships with no Supabase config at all. If the host builds from
GitHub, they belong in the build-variable section, not just runtime.

---

## Step 8 — Verify

```bash
npm run test:all
```

241 checks, including schema presence, RLS isolation, progress persistence,
star triggers and the unlock rules. It creates a throwaway student, exercises
everything, and deletes it.

Then by hand:

- Log in as an existing student (password preserved, or after reset)
- Open a lesson, complete one, refresh — progress persists
- Admin panel: analytics populated, approval queue works
- Avatar renders on the profile page
- Tutor: send one message, confirm the reply and the daily counter

Row counts to compare against `db-export/MANIFEST.md`:

```sql
SELECT 'profiles' t, count(*) FROM public.profiles
UNION ALL SELECT 'auth.users', count(*) FROM auth.users
UNION ALL SELECT 'day_completions', count(*) FROM public.day_completions
UNION ALL SELECT 'defi_results', count(*) FROM public.defi_results
UNION ALL SELECT 'activity_results', count(*) FROM public.activity_results
UNION ALL SELECT 'star_awards', count(*) FROM public.star_awards
ORDER BY 1;
```

---

## Step 9 — Decommission

Only after verification, and after at least one student has logged in
successfully on the new project:

1. Keep a final export and the `pg_dump` of the old project somewhere safe
2. Confirm the app and host no longer reference the old ref
3. Then release the old project

---

## Cutover notes

- **Freeze window.** Anything a student does between the export and the DNS/env
  switch is lost. Either migrate during a quiet hour, or re-run steps 3 and 5 for
  the delta immediately before switching.
- **Rotate secrets afterwards.** The OpenAI and service-role keys have been
  handled in plaintext during these migrations; rotate both once settled.
- **Backups.** Confirm automated backups are on for the new project, and restore
  one once to prove it works.
