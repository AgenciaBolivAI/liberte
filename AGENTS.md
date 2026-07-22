# AGENTS.md — Liberté · Instituto de Francés

Guidance for AI coding agents working in this repository. It assumes you know
nothing about the project.

<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project overview

**Liberté** (production: `libertefrances.com`) is a paid, 6-month online French
course for Spanish speakers (A1–A2). All UI copy is **Spanish**, course content
is French, and code + comments are **English** — write new artifacts in English
and user-facing strings in Spanish.

The product: students progress through a day-by-day program (lessons, videos, a
daily "défi" quiz, star rewards, streaks), practice with an AI conversation
tutor ("Lib", text and hands-free voice), join live classes, and get weekly
evaluations. New signups stay locked until an admin approves them. Admins get a
teacher panel with an approval queue, analytics, and read-only student
impersonation.

This is a **Lovable-generated project** (template `tanstack_start_ts_current`,
see `.lovable/project.json`). Some files carry a "do not edit" generated header.

## Tech stack

- **Framework**: TanStack Start (React 19 SSR full-stack framework) on Vite 8,
  with Nitro as the server engine. Deployed to **Cloudflare** (`.wrangler/`).
- **Routing**: TanStack Router, file-based (`src/routes/`), with TanStack Query.
- **Backend / DB**: Supabase (Postgres, Auth, Row-Level Security, Storage, pgmq
  email queues). Migrations in `supabase/migrations/`.
- **AI**: OpenAI API called directly from server code (`src/lib/ai.ts`):
  `gpt-4o-mini` (chat), `gpt-4o-mini-transcribe` (STT), `gpt-4o-mini-tts` (TTS).
  The Lovable AI gateway is intentionally NOT used.
- **Email**: Resend API (welcome/admin emails in the public signup endpoint) and
  Lovable email infrastructure (queued transactional/auth emails).
- **UI**: Tailwind CSS v4 (CSS-first config in `src/styles.css`), shadcn/ui
  ("new-york" style, see `components.json`), Radix primitives, lucide icons.
  Brand palette: NAVY `#3D5589`, BLUE `#4BB1EC`, SKY `#9BCBEF`, ICE `#EDF8FC`,
  RED `#C44536`. Fonts: Plus Jakarta Sans (display), DM Sans (body).
- **Language**: TypeScript, strict mode, ESM (`"type": "module"`).

## Runtime architecture

- `vite.config.ts` uses `@lovable.dev/vite-tanstack-config`, which **already
  includes** tanstackStart, the React plugin, Tailwind, tsconfig paths, nitro
  (Cloudflare target), the `@` path alias, and `VITE_*` env injection. **Do not
  add those plugins manually** — duplicates break the app. It redirects the
  server entry to `src/server.ts`.
- `src/server.ts` wraps the TanStack Start server entry to render a proper HTML
  error page on catastrophic SSR failures (h3 swallows handler throws into a
  JSON 500; this normalizes them).
- **Server functions**: `src/lib/*.functions.ts` use `createServerFn` +
  `requireSupabaseAuth` middleware (`src/integrations/supabase/auth-middleware.ts`,
  which validates the Bearer JWT via `auth.getClaims`). These modules **ship to
  the client bundle** — never read secrets at module top level; read them inside
  handlers, and dynamically `await import("@/integrations/supabase/client.server")`
  inside handlers when the service role is needed. `*.server.ts` modules are the
  server-only convention (the `server-only` package is banned by ESLint).
- **API routes** also live under `src/routes/` using `createFileRoute(...)({
  server: { handlers: { POST: ... } } })`:
  - `src/routes/api/public/liberte-frances-signup.ts` — public lead-capture:
    zod validation, in-memory rate limit, HTML-escaping for email templates,
    saves to `leads`, sends Resend welcome + admin-notification emails.
  - `src/routes/lovable/email/queue/process.ts` — pgmq email queue worker
    (Bearer token must equal `SUPABASE_SERVICE_ROLE_KEY`, compared
    timing-safe; retries, TTL, DLQ).
  - `src/routes/api/telegram/webhook.ts` — Telegram bot webhook (gated by the
    `TELEGRAM_WEBHOOK_SECRET` header) linking `profiles.telegram_chat_id` via
    `/start <code>`; `src/routes/api/telegram/reminders.ts` — cron-called
    live-class reminders (gated by `CRON_SECRET`). Bot sends live in
    `src/lib/telegram.ts` (best-effort, never throws).
- **Auth flow**: Supabase Auth. `src/lib/auth-context.tsx` loads session,
  profile, admin role (`user_roles` + `has_role` RPC) and approval state.
  `src/components/AuthGate.tsx` (mounted in `__root.tsx`) redirects
  unauthenticated users and shows `PendingApproval` until `profiles.approved_at`
  is set. Approval checks deliberately **fail open** if the approval migration
  is missing. Login/signup/admin routes use obfuscated URLs
  (`/liberte-log-in-983749824923465723`, etc.) — the public paths list is in
  `AuthGate.tsx`.
- **Supabase clients** (`src/integrations/supabase/`): `client.ts` (lazy-proxy
  anon/publishable client for browser + SSR), `client.server.ts` (service role,
  bypasses RLS — server code only), `realtime-shim.ts` (guards Realtime on
  Node < 22 which has no global WebSocket), `types.ts` (generated DB types).
  Both clients ship a custom fetch that handles the new opaque Supabase API keys
  (`sb_publishable_` / `sb_secret_`): sends `apikey` header and strips the
  bogus `Authorization: Bearer <key>`.

## Repository layout

- `src/routes/` — pages (file-based routing). Key routes: `index.tsx` (landing +
  lead form), `day.$dayId.tsx` (the core lesson player, ~3900 lines),
  `conversation.tsx` (AI tutor incl. voice mode), `semaine.$weekId.tsx`,
  `defi-semaine2.tsx`, `clasesenvivo.*` (live classes), `calendar.tsx`,
  `progress.tsx`, `profile.tsx`, `coach.tsx`, plus the admin panel at
  `liberte-profesor-panel-9382745-admin.tsx`. Routing conventions are documented
  in `src/routes/README.md` (`$param`, `{-$opt}`, `$` splat, `_layout`,
  `__root.tsx` is the only shell — keep `<Outlet />`).
- `src/routeTree.gen.ts` — **auto-generated, never edit by hand** (also
  prettier-ignored).
- `src/lib/` — business logic and server functions: `unlock.ts` (progressive
  unlock rules, pure functions), `program.ts` is in `src/data` (24-week
  schedule), `progress.ts` (streaks, local-day based), `ai.ts` (OpenAI helpers),
  `audio.ts` (voice capture/playback: VAD silence detection, iOS WebKit
  hardening), `tutorContext.ts` (per-day tutor scenarios), `admin-preview.ts`
  (teacher/student preview store), `*.functions.ts` (server functions),
  `utils.ts` (`cn()`).
- `src/data/` — course content: `day1..day10.ts`, `day1..day10Lessons.ts`,
  `program.ts`.
- `src/components/` — app components; `src/components/ui/` — shadcn/ui (add new
  ones per `components.json` aliases: `@/components`, `@/lib`, `@/hooks`).
- `src/integrations/supabase/` — Supabase clients/middleware/types. Files marked
  "automatically generated" come from the Lovable Supabase template — edit with
  care.
- `src/assets/` — images/media; `*.asset.json` are Lovable-managed asset
  descriptors.
- `src/styles.css` — Tailwind v4 theme (design tokens as CSS variables).
- `supabase/migrations/` — all schema changes as SQL migrations.
- `scripts/test-all.mjs` — the test suite (see below).
- `backup-csv/`, `liberte-prueba_260718.backup` — database backups (reference
  only, not part of the app).

## Domain model (course logic)

- Program: 6 months × 4 weeks = 24 weeks (`src/data/program.ts`). Month themes:
  J'OSE, JE VIS, JE CRÉE, JE PARLE, JE VOYAGE, JE SUIS LIBRE. Week W of month M
  unlocks on day `(M-1)*35 + (W-1)*7` after enrollment; a 7-day rest week
  separates months. Coaches can override unlocks (`week_unlocks`). Exactly one
  week is "current": the first unlocked-but-not-completed week.
- Days 1–10 (month 1 weeks 1–2) have full lesson content. Lesson order per day:
  `gym → intro → vocab → cles → defi`. Lesson N unlocks when lesson N−1 is done.
- Unlock rules live in `src/lib/unlock.ts` as **pure functions** (unit-tested by
  the test suite) and are mirrored/enforced server-side in
  `src/lib/tutor.functions.ts` (`assertDayUnlocked`). Day N opens when day N−1
  is done (day complete OR défi submitted); the first day of the viewed week is
  always open. Tutor scenes are strictly sequential (no week exception). Admins
  bypass all locks.
- **Stars** (`star_awards`) are granted **only by database triggers**: +2 on day
  completion, +2 on défi, +3 on weekly evaluation. Clients cannot insert stars
  (RLS). Duplicate completions are rejected (unique constraints).
- **AI tutor**: scene-based roleplay per day with objectives, corrections and
  suggestions (structured JSON). Daily cap of 30 messages/user enforced
  atomically via the `tutor_consume_message` RPC. Voice mode: browser capture →
  Whisper STT → chat → TTS mp3 in the same round trip; heavy iOS/WebKit
  hardening (see `src/lib/audio.ts`) and hallucination guards (see
  `src/lib/ai.ts` comments).
- Key tables: `profiles` (+ `approved_at`/`approved_by`), `user_roles`,
  `day_completions`, `day_state`, `week_state`, `star_awards`, `defi_results`,
  `activity_results`, `weekly_evaluations`, `week_unlocks`, `leads`,
  `calendar_events`, `tutor_conversations`, `tutor_usage`, `messages`
  (teacher↔student DMs; the table is in the `supabase_realtime` publication so
  the inbox and threads update live — RLS confines the stream), plus
  email-infra tables (`email_send_log`, `email_send_state`, …).

## Commands

Package manager: both `bun.lock` and `package-lock.json` exist; scripts are
documented as `npm run …`. `bunfig.toml` configures bun installs with a 24h
`minimumReleaseAge` supply-chain guard — do not add packages to
`minimumReleaseAgeExcludes` without confirming with the user.

```bash
npm run dev        # vite dev (local dev server)
npm run build      # production build → .output/ (Cloudflare)
npm run preview    # preview the build
npm run lint       # eslint .
npm run format     # prettier --write .
npm run test:all   # full end-to-end suite (scripts/test-all.mjs)
npm run verify     # tsc --noEmit && vite build && test:all
```

## Testing strategy

There is **no unit-test framework**. `scripts/test-all.mjs` is the test suite —
its header says "Run after EVERY change". It:

- validates `.env` and config;
- transpiles `src/lib/unlock.ts` and `src/data/program.ts` on the fly and tests
  the pure unlock/schedule rules in-process;
- runs against the **real Supabase project**: creates a throwaway student,
  checks auth, the approval flow, RLS isolation (can't read others' profiles,
  can't self-grant admin, can't insert stars, can't self-approve), progress
  persistence, star triggers, tutor state/limits, admin queries, then deletes
  the student and verifies cascade cleanup;
- greps source files for feature/regression guards (video gating incl. YouTube
  embeds, preview-mode read-only, atomic tutor cap, mobile fixes, etc.);
- inspects the built bundle in `.output/` (Supabase URL inlined, service-role
  and OpenAI keys NOT present).

Prerequisites: a populated `.env`; run `npm run build` first or the bundle
checks are skipped. When you change business logic, extend `test-all.mjs` with a
guard — many existing checks are regression tests for real production bugs.

## Code style

- TypeScript strict; ESM; path alias `@/*` → `./src/*` (also used by shadcn).
- Prettier: `printWidth: 100`, double quotes, semicolons, `trailingComma: "all"`.
  ESLint (flat config) extends recommended TS + react-hooks + prettier; unused
  vars are allowed; `server-only` imports are banned (rename to `*.server.ts`).
- Match existing patterns: server functions in `src/lib/*.functions.ts` with
  `createServerFn` + `requireSupabaseAuth` + `inputValidator`; admin-only
  functions check `has_role(..., 'admin')` (see `src/lib/admin.functions.ts`).
- Comments are valued in this codebase — non-obvious decisions (security gates,
  fail-open behavior, measured latencies, hardware quirks) are documented
  inline. Keep comments accurate when you change behavior.
- Make minimal, scoped changes; the test suite greps for specific code patterns,
  so unrelated rewrites can break it.

## Security considerations

- **Secrets**: `.env` (gitignored) holds `SUPABASE_URL`,
  `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`,
  `RESEND_API_KEY` (+ `VITE_*` mirrors, `LOVABLE_API_KEY` and `LOVABLE_SEND_URL`
  for the email worker), plus the Telegram integration
  (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`) and `CRON_SECRET` for the
  reminders cron endpoint. `.env.example` documents every variable.
  `VITE_*` vars are inlined into the client bundle at build time — never put
  secrets behind `VITE_*`. The service-role key and OpenAI key must never reach
  client code; the test suite verifies this against the built bundle.
- **RLS is the authorization layer**: tables have row-level security; the
  service-role client (`client.server.ts`) bypasses it and is for trusted
  server handlers only — dynamic-import it inside handlers, never top-level in
  route or `*.functions.ts` files.
- Privileged mutations (approval, star awards, admin role) are blocked for
  regular users by RLS; star awards happen only via DB triggers.
- Public endpoints validate input with zod, rate-limit, escape user data
  interpolated into email HTML, and compare bearer tokens timing-safe.
- The tutor server function re-checks approval before spending OpenAI tokens and
  enforces the daily cap atomically in the DB (no read-then-write races).

## Deployment

- Build output is `.output/` (Nitro, Cloudflare target; `.wrangler/` is
  Wrangler state). `npm run build` must pass for a deployable artifact.
- The deployed app relies on `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`
  being present **at build time** — otherwise the client bundle cannot reach
  Supabase (the test suite checks the bundle for the inlined URL).
- Database changes go through `supabase/migrations/*.sql` (project id in
  `supabase/config.toml`); the app code tolerates missing newer migrations in
  several places (fail-open patterns) — preserve that behavior.
- Remember the Lovable notice at the top: pushes to the connected branch sync
  back to Lovable; keep the branch working and don't rewrite pushed history.
