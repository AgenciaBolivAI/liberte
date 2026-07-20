# Liberté — Scaling Recommendations

Prepared 18 July 2026. Based on a full audit of the codebase, database and product surfaces.

---

## 1. Executive summary

The platform is technically sound: it now runs entirely on infrastructure you own, with 21 migrated students, working AI grading, a voice conversation tutor, live analytics, and an admin approval flow. There are 241 automated tests covering the critical paths.

**The constraint is not technology. It is content, and the way content is produced.**

You are selling a six-month programme and have built two weeks of it. Worse, adding a new day currently requires a developer to write roughly 760 lines of hand-authored code. At that rate, completing the programme means around 83,000 lines of TSX. That is not a scaling problem; it is a hard stop that arrives the day a student finishes Day 10.

Everything else in this document is worth less than fixing that.

| Priority | Initiative | Why now |
|---|---|---|
| 1 | Content authoring system | Removes the only true blocker to delivering what you sell |
| 2 | Payments (Stripe) | Growth is currently capped by manual onboarding |
| 3 | Automated reminders | Cheapest retention available; data already exists |
| 4 | Placement test | Best lead magnet, and routes students to the right week |
| 5 | Pronunciation scoring | The clearest differentiator against Duolingo et al. |

---

## 2. Where the product stands today

**Built and working**

- Daily lessons for Days 1–10 (Weeks 1–2), with video, vocabulary, grammar, exercises and a spoken final challenge
- AI evaluation: daily challenge grading, per-activity correction, weekly evaluation with PDF report
- AI conversation tutor: scenario roleplay per day, text and hands-free voice, gentle corrections, objectives
- Progress persistence: lesson-level state, day completions, stars, streaks — across devices
- Live class scheduling with a teacher-managed calendar
- Admin panel: live analytics with time ranges, approval queue, student detail, view-as-student
- Public landing page with lead capture, and an admin approval gate on new accounts

**Missing or incomplete**

- Content for Weeks 3–24 (92% of the programme)
- Any payment or self-serve enrolment
- Any outbound communication after signup (no reminders, no re-engagement)
- Content authoring for non-developers
- Pronunciation assessment, placement testing, certificates
- Error monitoring, backup policy, cost controls on AI usage

---

## 3. Priority 1 — Content authoring system

**The problem, measured.** 7,605 lines of code produce 10 days of lessons. 37 per-day React components are hardcoded into a single route file. Each new day requires a developer.

**The opportunity.** Every lesson you have is one of a small number of repeating patterns: vocabulary drill, reading comprehension, listening multiple-choice, speaking prompt, writing prompt, grammar pair drill, staged spoken challenge. There is no structural reason each day needs bespoke code.

**What to build**

1. Move lesson content out of code and into database tables (`lessons`, `lesson_blocks`, `lesson_items`)
2. Build one generic renderer that draws any lesson from that data — replacing all 37 components
3. Build a teacher-facing authoring UI: create a day, add blocks, paste a video URL, type vocabulary, define challenge criteria
4. Migrate Days 1–10 into the new system so nothing remains in code
5. Optional: an AI drafting assistant that proposes a day's vocabulary and exercises from a theme, for the teacher to edit

**Impact.** Content production moves from a developer-week per day to roughly an hour per day, done by the teacher. This is the difference between a two-week demo and a six-month product.

**Rough effort.** Two to three weeks of development. It is the highest-return work available.

---

## 4. Priority 2 — Payments and self-serve enrolment

Today enrolment is manual: a lead arrives, someone contacts them, an admin approves the account. That caps growth at the teacher's personal capacity and leaks every lead that goes cold.

**Recommended**

- Stripe Checkout from the landing page, with automatic approval on successful payment
- Keep the existing approval gate for scholarships, trials and manual cases
- Support instalments — important in the LatAm market
- Consider local payment rails per country (card penetration varies widely); Stripe covers some, but Bolivia in particular may need an alternative

**Pricing structure worth testing**

| Tier | Contents |
|---|---|
| Self-study | Daily lessons, AI grading, AI tutor |
| Complete (recommended) | Self-study plus live classes and weekly reports |
| Premium | Complete plus periodic one-to-one sessions |

The AI tutor is genuinely expensive to run relative to the rest; it is a reasonable lever to differentiate tiers by usage limits rather than removing it entirely.

---

## 5. Priority 3 — Retention and re-engagement

You have streaks and completion data, and an email provider already integrated, but **nothing currently reaches out to a student**. For a daily-habit product this is the largest single retention lever, and it is cheap.

**Recommended, in order**

1. **Streak reminders** — "you are on a 4-day streak" before it lapses
2. **Inactivity nudges** — 3 days without activity triggers an encouraging message; your analytics already identifies exactly who these students are
3. **At-risk alerts to the teacher** — a weekly digest of students who have stalled, so intervention is human and personal
4. **Weekly progress summary to the student** — stars earned, days completed, what is next
5. **WhatsApp** — in Latin America this materially outperforms email. Worth serious consideration via the WhatsApp Business API; your students already gave phone numbers at signup

---

## 6. New offerings worth building

**Placement test.** A five-minute diagnostic that scores level and recommends a starting week. Doubles as your strongest lead magnet ("discover your French level in 5 minutes") and reduces early churn from students who are mis-levelled. The AI evaluation machinery already exists.

**Pronunciation scoring.** You already record and transcribe student speech. Scoring specific target sounds — the *voudrais* and *croissant* feedback already present in your week-one prompts — and tracking improvement over time is the clearest differentiator against mass-market apps, which do this poorly.

**Spaced repetition review.** Vocabulary from earlier days resurfacing on a review schedule is the single best-evidenced technique in language learning. Your vocabulary is already structured data; a daily five-minute review drawing from past days is comparatively cheap to build and materially improves outcomes.

**Completion certificates.** You already generate PDFs. A per-month certificate is free marketing when shared in WhatsApp groups, and a motivational milestone.

**Free tier as a funnel.** The AI tutor is your most distinctive asset and is currently entirely behind enrolment. A limited free version — five messages a day, Day 1 scene only — costs pennies per user and gives prospects a genuine taste of the thing competitors cannot match.

**Progressive Web App install.** Students use this daily on phones. Installing removes repeated microphone permission prompts, puts an icon on the home screen, and enables push notifications, which are far more effective than email for daily habits.

**Community.** A cohort space — even a well-run WhatsApp group initially — increases completion rates substantially in cohort-based courses. Worth doing manually before building anything.

---

## 7. Teacher leverage and operations

The programme currently depends on one teacher delivering eight live classes a month. That is the second constraint after content.

- **Record and index live classes** so absent students stay on track and recordings become reusable assets
- **Automate the weekly report** — students already generate evaluation PDFs; sending them automatically to both student and teacher removes manual work
- **Group similar cohorts** as enrolment grows, rather than scaling class count linearly
- **Document the teaching method** so a second teacher can be onboarded. Today the business cannot operate without Alejandra; that is a real risk to both continuity and valuation

---

## 8. Technical foundations and risk

Not urgent for 21 students; important before 200.

- **Error monitoring** — there is currently no visibility into production failures. A student hitting a broken flow is invisible to you unless they complain
- **Backups and disaster recovery** — you have just taken ownership of the database. Confirm automated backups are enabled and test a restore at least once
- **AI cost controls** — usage is capped per student per day, which is good. Add a global monthly ceiling that degrades gracefully rather than failing hard or producing a surprise bill
- **Node 22 upgrade** — the Supabase client has formally deprecated Node 20; a compatibility shim is in place but this should not be permanent
- **Rate limiting** — the public lead endpoint has basic in-memory limiting; move to durable limiting before running paid traffic
- **Secrets hygiene** — the OpenAI and service-role keys have been handled in plain text during migration. Rotate both, and store them as encrypted secrets rather than plaintext environment variables
- **Accessibility** — the app has not been audited for screen readers or contrast; a basic pass protects you legally and widens the audience

---

## 9. Market expansion

- **Portuguese-speaking market (Brazil).** The product architecture is language-agnostic; the interface is Spanish and the target language French. Adding Portuguese interface copy opens a market several times larger than Bolivia and Colombia combined
- **Other target languages.** Nothing in the platform is specific to French except the content and prompts. English for Spanish speakers is a vastly larger market, if you ever want to reuse the engine
- **Institutional sales.** Schools, universities and companies buying seats is a materially different economic model from individual enrolment, and your admin panel and cohort tooling are close to what that requires
- **Content marketing and SEO.** The landing page is new and indexable, with a sitemap. Regular free content ("50 French phrases for travel") is the standard low-cost acquisition channel in this category

---

## 10. Suggested 90-day sequence

**Days 1–30 — Remove the wall**
Content authoring system; migrate Days 1–10; teacher produces Week 3 unaided as the proof.

**Days 31–60 — Turn on the engine**
Stripe checkout and self-serve enrolment; streak and inactivity reminders; PWA install; error monitoring; rotate secrets.

**Days 61–90 — Differentiate and grow**
Placement test as lead magnet; free tutor tier; pronunciation scoring; certificates; referral programme.

Throughout: the teacher should be producing content continuously once the authoring system exists. Content velocity is the metric that matters most for the next quarter.

---

## 11. Decisions needed from you

1. **Content plan** — who writes Weeks 3–24, and on what schedule? This determines whether the authoring system is used at full capacity or sits idle
2. **Pricing** — no price exists anywhere in the product today. The funnel cannot convert without one
3. **Payment rails** — is Stripe sufficient for your markets, or is a local processor required for Bolivia?
4. **Live class model** — does it stay one teacher and small cohorts, or move toward larger groups and recordings?
5. **Free tier** — willing to spend a small amount of AI budget on non-paying prospects in exchange for a much stronger funnel?

---

## 12. Honest assessment

The platform is in good shape and materially better than it was: it is independent of Lovable, tested, secured, and running on infrastructure you control. The engineering risk is low.

The business risk is concentrated in two places: **you are selling six months and have built two weeks**, and **the business cannot currently operate without one specific person**. Both are solvable, and neither is solved by adding features.

Build the content system. Everything else follows from having a product that matches the promise.
