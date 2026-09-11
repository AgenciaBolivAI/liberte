# Liberté — e-mail templates

Ten branded templates. Six go straight into the Supabase dashboard; four are
sent by the platform itself through Resend.

Everything is generated from one skeleton (`build.mjs`) so the header, footer
and palette can never drift apart. The `.html` files are committed — you do
**not** need to run anything to use them. Just open the file, copy all of it,
paste.

---

## 1. Supabase auth e-mails — copy/paste

**Where:** Supabase dashboard → your project → **Authentication → Emails**
(templates tab). Pick the template on the left, paste the whole file into the
message body, and set the subject to the one below.

| File | Supabase template | Subject line |
|---|---|---|
| `supabase/01-confirm-signup.html` | Confirm signup | `Confirma tu correo para entrar a Liberté 🇫🇷` |
| `supabase/02-reset-password.html` | Reset Password | `Restablece tu contraseña de Liberté` |
| `supabase/03-magic-link.html` | Magic Link | `Tu enlace de acceso a Liberté` |
| `supabase/04-invite-user.html` | Invite user | `Te invitamos a Liberté 🇫🇷` |
| `supabase/05-change-email.html` | Change Email Address | `Confirma tu nueva dirección de correo` |
| `supabase/06-reauthentication.html` | Reauthentication | `Tu código de verificación de Liberté` |

### Variables — leave them exactly as written

Supabase replaces these when it sends. They use Go-template syntax, **with a
dot**:

| Variable | Used in | Meaning |
|---|---|---|
| `{{ .ConfirmationURL }}` | templates 01–05 | the one-time action link |
| `{{ .Token }}` | 06 | the 6-digit code |
| `{{ .Email }}` | 05 | the current address |
| `{{ .NewEmail }}` | 05 | the address being changed to |

Changing a space inside `{{ .ConfirmationURL }}` breaks it, so copy the whole
file rather than retyping parts of it.

---

## 2. Two dashboard settings to change while you are in there

These are not template problems, but they are the reason students were stuck,
and the templates cannot fix them on their own.

**a) Add the reset page to the redirect allowlist.**
Authentication → URL Configuration → **Redirect URLs** → add:

```
https://www.libertefrances.com/reset-password
https://libertefrances.com/reset-password
```

Measured on this project: Supabase **discards** a `redirectTo` whose path is not
on that list and falls back to the Site URL, which is why the reset link dropped
students on the platform instead of the "new password" form. The app now
compensates in code, but fixing the allowlist makes the link land directly on
the right page.

**b) Consider turning "Confirm email" off.**
Authentication → Sign In / Providers → Email → **Confirm email**.

Measured: 0 of 43 accounts were auto-confirmed and the average gap between
signing up and being able to log in was **8.5 hours**. The platform already
gates access with its own admin approval, so this is a second queue in front of
the first. If you keep it on, template 01 is what students receive, and the
login screen now explains the situation and offers to resend it.

---

## 3. Platform e-mails (sent with Resend, not Supabase)

These cannot be pasted into Supabase — they are sent from our own code.

| File | When it is sent | Status |
|---|---|---|
| `transactional/welcome.html` | Someone asks for information on the landing page | **Already sending** — `src/routes/api/public/liberte-frances-signup.ts` |
| `transactional/new-lead-notification.html` | Same moment, to `libertedirec@gmail.com` | **Already sending** — same file |
| `transactional/application-approved.html` | An admin approves a student in the panel | **Not wired yet** — see below |
| `transactional/application-denied.html` | An admin denies a student | **Not wired yet** — see below |

`approveStudent` and `denyStudent` in `src/lib/admin.functions.ts` currently
change the student's status **without sending anything**, so the student sits on
the "Compte en cours de vérification" screen with no idea it was decided. The
two templates are ready; wiring them is a small change to those two functions —
say the word and I'll do it.

### Variables — no dot, so they can never be confused with Supabase's

| Variable | Files |
|---|---|
| `{{FIRST_NAME}}` | welcome, approved, denied |
| `{{LOGIN_URL}}` | welcome, approved |
| `{{FULL_NAME}}` `{{EMAIL}}` `{{PHONE}}` `{{NATIONALITY}}` `{{MESSAGE}}` | new-lead-notification |

Whatever fills `{{MESSAGE}}`, `{{FULL_NAME}}` and the rest **must be
HTML-escaped first** — the existing code already does this with `escapeHtml`.
Pasting a student's raw text into the template would let it inject markup.

---

## 4. What is baked into every template

- **Logo:** the real 34 KB PNG from production, verified reachable. The 1.5 MB
  "bon voyage" banner is deliberately not used — it is far too heavy for an
  inbox and would load slowly or not at all on a phone.
- **Table layout, inline styles.** Outlook renders with Word's engine and has no
  flexbox or grid; Gmail drops `<style>` blocks in some views. The only CSS left
  in `<style>` is the mobile media query, which is purely additive.
- **Bulletproof button.** Outlook gets a VML `roundrect` (it ignores padding and
  border-radius on a link), everyone else gets a normal anchor.
- **A visible fallback link** under every button, because plenty of corporate
  clients strip or rewrite the button.
- **Preheader text** — the grey line an inbox shows next to the subject. Without
  it, clients scrape the first visible words, which is usually "¿El botón no
  funciona?".
- **Size guard.** Gmail clips a message past ~102 KB and hides the rest behind
  "View entire message", which would bury the button. `build.mjs` fails the
  build if any template gets near that. Largest today: 8.7 KB.
- **"Made by BolivAI"** in the footer, linked, on all ten.

Language follows the platform: Spanish body with French brand touches, matching
the welcome e-mail that was already being sent.

---

## 5. Changing the brand

Edit `BRAND`, `SITE` or `LOGO` at the top of `build.mjs`, then:

```bash
node templates/build.mjs
```

It rewrites all ten files and prints each size. Re-paste the Supabase ones
afterwards — the dashboard keeps its own copy, it does not read this folder.
