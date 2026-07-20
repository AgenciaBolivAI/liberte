# Client Change-Requests — Analysis & Plan

Every requirement from the client's list, mapped to the actual code, with effort, dependencies, and the decisions needed. Verified against the working tree by a multi-agent code audit on 2026-07-18.

**Key facts to hold onto:**
- The live site `https://libertebeta-alpha.vercel.app` runs **OLD code**. Many of these complaints are **already fixed in the working tree** and just need a deploy — don't pay for finished work.
- The current Supabase project is **`tpqoszkffdmxdyskdnyi`** (the customer's own account; migration complete, all 25 accounts + passwords + data verified). The old `erhirgyryiymlrjsivtb` / `sfcgiijtkeamkrojfcrs` projects are legacy.
- **One security issue outranks everything — see Item 0.**

---

## Item 0 — SECURITY BLOCKER (owner action, do first)

The GitHub repo `AgenciaBolivAI/liberte` is **public** and contains student PII + password hashes (`backup-csv/`, `liberte-prueba_260718.backup`). This is a live data breach.

1. Make the repo **private** (GitHub → Settings → Danger Zone → Change visibility).
2. Purge the files from history and force-push (`git filter-repo --invert-paths --path backup-csv --path liberte-prueba_260718.backup --path db-export`).
3. Force-reset the 21 migrated students' passwords (window was short + hashes are bcrypt, but they were public).

Nothing else should deploy until this is closed.

---

## Status table

| ID | Requirement | State | Effort | Ships on deploy? |
|----|-------------|-------|--------|------------------|
| PLAT-1 | Don't require watching the whole video to advance | ✅ done locally | S | Yes |
| PLAT-2 | Tab-switch must not reset to lesson 1 | ✅ done locally | S | Yes |
| BUG-DAY6 | Sidebar: active day locked, other days unlocked | ✅ done locally | S | Yes |
| TUTOR-2 | Inline error correction mid-conversation | ✅ done locally (text) | S | Yes |
| TEACH-2 | Teacher edits calendar events/links | ⚠️ partial (add/delete done, **edit missing**) | S | Partial |
| PLAT-3a | Reset link redirects to **localhost** | ⚙️ config | S | No (dashboard) |
| PLAT-3b | Reset email doesn't arrive | ⚙️ config (SMTP) | S | No (dashboard) |
| PLAT-4 | Enable the whole week as a unit | ⚠️ partial | S | N/A |
| PLAT-5 | Time-based weekly unlocking from signup | ⚠️ partial (engine exists) | M | No (decision) |
| TUTOR-1 | Tutor picker organized by month → day | ⚠️ partial (UI only, 10 days) | S | N/A |
| TUTOR-3 | Second AI mode: Spanish "ask about French" Q&A | ❌ missing | M | No |
| TEACH-3 | Upload class slides + recorded-class links | ❌ missing | L (links half = M) | No |
| TEACH-1 | Teacher content-authoring system | ❌ missing | **XL** | No |

*S ≈ hours–1 day · M ≈ days · L ≈ 1–2 weeks · XL ≈ 2–3+ weeks.*

---

## 1. Already done — ships on the next deploy (do not re-quote)

Fixed in the working tree; the Vercel build is older and still shows the bugs. **One deploy resolves all of these.**

- **PLAT-1 — video no longer blocks advancing.** For days 1–10 the video gate is lifted (`OPEN_THROUGH_DAY`, `unlock.ts`; `nextLocked` false, `day.$dayId.tsx`).
- **PLAT-2 — tab-switch reset fixed.** The hydration effect now early-returns when the day/user hasn't changed (`hydratedKeyRef` guard, `day.$dayId.tsx`), so a token refresh on refocus no longer resets to lesson 1.
- **BUG-DAY6 — sidebar lock inconsistency resolved.** With weeks 1–2 fully open, Day 6 shows all 5 lessons like Day 7. *(Root cause: locks were only computed for the active day — `String(d.id) === activeDay && !isLessonUnlocked(idx)`; now moot because all lessons in open days are unlocked. It would return if strict day-gating is re-enabled — see Decision 1.)*
- **TUTOR-2 — inline correction (text).** The `{said, corrected, rule_es}` chip renders under the student's message. Works in text; in voice the correction is computed but not spoken (optional add).
- **TEACH-2 (partial) — calendar add/delete + Zoom links** in the teacher panel (`coach.tsx` CalendarManager, `calendar_events` table).

**Deploy prerequisites:** ① update Vercel's env vars to the new project (`SUPABASE_*` + the three `VITE_*`, which are baked in at **build** time). ② The DB migrations are already applied to `tpqoszkffdmxdyskdnyi`.

---

## 2. Config / small fixes

### PLAT-3a — Reset link redirects to localhost (the bug you just reported)
The **code is correct** (`AuthPage.tsx` uses `window.location.origin`). Supabase only honors a `redirectTo` if it's on the project's allowlist; otherwise it falls back to the **Site URL**, which is still the default `http://localhost:3000`. Fix in the dashboard for **`tpqoszkffdmxdyskdnyi`** → Authentication → URL Configuration:
- **Site URL** = `https://libertebeta-alpha.vercel.app`
- **Redirect URLs** → add `https://libertebeta-alpha.vercel.app/**`

This also fixes the signup-confirmation link (same pattern). ~2 minutes, no deploy.

### PLAT-3b — Reset email doesn't arrive
Supabase's built-in auth mailer is throttled (~2–4/hr project-wide) and often dropped. Fix in the same dashboard → Authentication → SMTP Settings → **Custom SMTP → Resend** (`smtp.resend.com`, user `resend`, the existing `RESEND_API_KEY`, sender `hola@libertefrances.com` — domain already verified). Then raise the Auth email rate limits. Fixes recovery + confirmation + magic-link mail at once. ~15–30 min, no deploy, no code.

### PLAT-5 — Time-based weekly unlocking (engine already exists)
`getWeeks` in `program.ts` **already computes exactly what the client described**: week 2 opens 7 days after signup, rest week after each month (`unlockDay = (m-1)*35 + (w-1)*7`). It's currently overridden by two launch shims: injecting weeks `[1,2]` for everyone (`student.tsx`) and `OPEN_THROUGH_DAY=10` (`unlock.ts`). Turning genuine time-gating on is a flag change — **but doing it safely is M-effort** because of the migrated-student risk (Decision 1).

---

## 3. Medium features

### TUTOR-3 — Spanish "ask me anything about French" Q&A mode (M)
A second assistant that answers **in Spanish** ("¿qué significa…?", "¿cuándo uso…?", "¿qué son los conectores?"), separate from roleplay-Lib (who stays in French). High reuse: a stripped clone of `sendTutorMessage` reusing `requireApprovedStudent`, the `tutor_consume_message` quota RPC, and `callChat`. New pieces: `ask.functions.ts` + Spanish-teacher prompt (no scenario/objectives/day-gate), a `pregunta.tsx` route reusing the chat bubbles, a TopNav entry. *Note: `callChat` forces JSON mode, so the prompt must return a JSON shape.*

### TUTOR-1 — Month → Day picker (S for UI)
Today a flat 10-option dropdown. A month→day hierarchical control (native `<optgroup>` labeled with the 6 month themes) is a **pure UI change now** over the existing 10 days. Spanning all 120 days is gated on **content** (TEACH-1), not on selector code.

### TEACH-2 — Calendar **edit** gap (S)
Add/delete work; **edit is missing**, so "modificar los enlaces" forces delete-and-recreate. Backend already allows it (UPDATE RLS + trigger). Add an edit mode that pre-fills the form and calls `.update().eq('id', …)`.

### TEACH-3 (links half) — Recorded-class link manager (M, shippable early)
The recorded-class-links half is independent of the big build: a `recorded_classes` table (CRUD RLS mirroring `calendar_events`), a panel in `coach.tsx`, and `clasesenvivo.index.tsx` reading it with the current hardcoded array as fallback. The **slide-upload half is L** (Storage + upload widget + viewer) and should reuse TEACH-1's patterns.

---

## 4. The big build — Content authoring (TEACH-1, XL) — the linchpin

All lesson content lives in code: `day.$dayId.tsx` (~3,900 lines) hardcodes the lesson maps and ~59 per-day components; plus `day1..10*.ts` (~3,700 lines) — **~7,600 LOC for 10 of ~120 days (~8%)**, and every new day needs a developer. The program is sold as 6 months.

**The de-risking fact:** the render engines are **already generic and prop-driven** (`ReadingComprehension`, `ListeningMCGame`, `SpeakingGame`, `WritingGame`, `MCQuestion`, `StagedDefi`, `VideoBlock`). The 59 components are thin wrappers. So this is externalize-data + build-a-dispatcher + authoring-UI — **not rewriting the games.** ~2–3 weeks.

- **1a — Schema (M):** `lessons` / `lesson_blocks` / `lesson_items` (polymorphic JSONB + per-type Zod). RLS: admins CRUD, enrolled students SELECT published. **Stable `block_key`s** so `day_state.done_lessons` migrates without losing progress.
- **1b — One `<LessonRenderer>` (L):** block-type→engine map replacing the dispatch; preserve `onAward` stars, the video gate, confetti, défi `dayId`. Deletes ~2,000+ lines.
- **1c — Teacher authoring UI (XL, ~half the effort):** day list, block editor, per-type editors, live preview, duplicate-day, publish/draft. v1 = paste YouTube/asset URLs; defer file upload.
- **1d — Migrate days 1–10 (M):** seed script → rows with `block_key`s matching current lesson keys; verify parity behind a flag; delete legacy code.

**Proof-of-done:** the teacher authors Week 3 (days 11–15) with no developer.

---

## 5. Recommended sequence (dependency-ordered)

1. **Item 0** — make the repo private, purge history, reset passwords (owner).
2. **Deploy the working tree** → instantly delivers PLAT-1, PLAT-2, BUG-DAY6, TUTOR-2, TEACH-2 add/delete. *(Update Vercel env vars first.)*
3. **In parallel (no deploy):** Supabase dashboard — Site URL + redirect allowlist (PLAT-3a) and Custom SMTP → Resend (PLAT-3b).
4. **Decision gate:** time-gating vs force-open, and the `enrolledAt` source (Decision 1) — settle before touching `OPEN_THROUGH_DAY`.
5. **Small wins:** TEACH-2 edit path; TUTOR-1 month→day picker (over existing 10 days).
6. **Medium, parallelizable:** TUTOR-3 Q&A mode; TEACH-3 recorded-class links.
7. **PLAT-5 rollout** once the enrolledAt decision + migrated-student backfill are done — *including server/day-route enforcement* so `/day/N` URLs aren't left open.
8. **TEACH-1** — the linchpin; unlocks the remaining ~110 days, the 120-day tutor picker, and TEACH-3's slide half.

---

## 6. Decisions the client must make

1. **Time-gated vs force-open (PLAT-5 vs PLAT-1/PLAT-4/BUG-DAY6).** `OPEN_THROUGH_DAY=10` is what currently satisfies PLAT-1 and masks BUG-DAY6. The client now wants genuine time-based unlocking. They collide on one flag. If switching to time-gated: decouple the video gate into its own flag so it doesn't regress, and handle the **migrated-student risk** — `user.created_at` is the *migration* date, not the real program start, so strict gating could lock students out of week 2 for 7 days. Mitigation: a dedicated `program_start_at` column backfilled to each student's true start, and/or coach-grant via `week_unlocks`.
2. **Password-reset SMTP approach (PLAT-3b):** Custom SMTP → Resend (recommended, ~30 min) vs. a Supabase send-email hook into the existing Resend queue (branded templates, more work).
3. **Q&A quota (TUTOR-3):** share the 30/day pool (no DB work, modes compete) vs. a separate budget (new migration, ~2× worst-case spend).
4. **Content plan (TEACH-1):** confirm the XL investment — the program can't ship past week 2 without it. For TEACH-3, clarify "subir las diapositivas" = upload a slide **file** (PDF/images, L) vs. rebuild interactive decks (XL — recommend against).
