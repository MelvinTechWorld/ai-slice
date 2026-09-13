# AGENTS.md — Rules for AI coding agents on this repository

<!--
Read by Antigravity (v1.20.3+), Cursor, and Claude Code.
Antigravity-specific overrides go in GEMINI.md, which takes priority over this file.
Additional workspace rules live in .agent/rules/.
-->

## Project Overview

- **Name:** ai-slice
- **Type:** Graded bootcamp assessment. A single working flow ("a slice"), not
  an application.
- **Which assessment:** 3 — The AI Integration Slice
- **Authoritative spec:** `.agent/rules/brief-full.md` and
  `.agent/rules/assessment-3.md`. Where anything conflicts, the brief wins.

This repository will be reviewed by a human who asks me verbal defence questions
about every decision in it. Optimise for **legibility and defensibility**, not
for features, cleverness, or completeness.

## Tech Stack

- **Language:** TypeScript
- **Framework:** Next.js (App Router, no `src/` directory)
- **Styling:** Tailwind CSS
- **UI components:** None — hand-rolled. No component library.
- **Database:** PostgreSQL
- **ORM / query layer:** Prisma
- **Package manager:** npm

Do not introduce a new library, framework, or service without asking me first.

---

## HARD SCOPE LIMITS — violating these loses marks

Every assessment brief has a "Do not build" section. It is meant literally.

- **NEVER** build a landing page, marketing page, hero section, or pricing page.
- **NEVER** add a feature that is not explicitly listed in
  `.agent/rules/assessment-3.md`.
- **NEVER** add settings, profile editing, avatars, search, tags, sharing,
  export, dark mode toggles, onboarding tours, or analytics.
- Where the brief says "placeholder dashboard", build **exactly** this: one line
  of text showing the user's name, and a sign-out button. Nothing else. No
  cards, no stats, no navigation beyond sign-out.
- **NEVER** add seed data, placeholder content, or fake records to make a screen
  look populated. Empty states must be genuinely empty.

If you believe a feature would improve this repository, **do not add it**. Say
so in your response in one sentence and let me decide.

---

## DECISION PROTOCOL — the most important rule in this file

Section 5 of my documentation requires me to state, for every concept, *what I
chose against and why*. I cannot answer that if you make the choice silently.

**Before doing any of the following, STOP. Do not write the code yet.**

- Choosing a library, algorithm, or provider (hashing, validation, sessions,
  queueing, rate limiting, storage, email)
- Designing a table, adding a column, or adding a constraint
- Choosing an HTTP status code where more than one is defensible
- Setting any tunable value (cost factor, TTL, timeout, temperature, token cap,
  concurrency limit, rate limit window)
- Choosing between doing something in the database, the server, or the client

**Present this instead:**

1. The options, with at least two real alternatives
2. The tradeoff between them, in one or two sentences each
3. Your recommendation
4. One line on what concretely breaks if I pick the other one

Then **wait for my answer.** Do not proceed on your own recommendation.

After I choose, append the decision to `docs/decisions.md` using the template at
the top of that file. Do not skip this step and do not batch it up for later.

---

## SECRETS — no exceptions

- **NEVER** write a real API key, secret, token, database URL with credentials,
  or webhook secret into any file. Not `.env`, not a config file, not a comment,
  not a test fixture.
- Write **placeholders only**, into `.env.example`, with a comment saying where
  each value comes from.
- If you need a real key to proceed, tell me which variable name you need and
  **stop**. I will type it in by hand.
- Before the first commit, confirm `.env` is in `.gitignore` and report that you
  checked.
- If you ever see what looks like a real secret in this repository, stop and
  tell me immediately.

---

## EVIDENCE DUTY

Each assessment requires captured proof (database screenshots, curl output, log
tables). None of it can be reconstructed after the fact.

The evidence checklist is at the bottom of `.agent/rules/assessment-3.md`.

- After completing any feature that appears on that checklist, **stop and remind
  me to capture the evidence** before moving to the next task.
- Do not start the next task until I confirm it is captured.
- When I confirm, log the filename and what it shows in `docs/evidence.md`.
- Where evidence requires a `curl` command, write the exact command out for me,
  ready to paste, with a note on what response I should expect.

---

## DOCUMENTATION DUTY — who writes what

`DOCUMENTATION.md` is graded as heavily as the code, and it exists to prove *I*
understand the work. Some of it you may draft; some of it you must not.

**You may draft (mechanical, verifiable from the code):**

- Section 2, How To Run It
- Section 3, The Flow, Step By Step
- Section 4, The Data Model — schema and column notes, but leave the
  "which constraints make an invalid state impossible" answer to me

**You must NOT write (I write these myself, in my own words):**

- Section 1, What This Is
- Section 5, The Concepts — all four questions, every concept
- Section 6, What Went Wrong
- Section 7, What This Slice Does Not Handle
- Section 8, If I Built This Again
- The LinkedIn post

If I ask you to write one of those, remind me of this rule once, then respect my
decision. What you may do instead is **ask me the four questions out loud** for
a concept and let me answer, or point me at the relevant entry in
`docs/decisions.md`.

---

## Code Standards

- Every new file gets a one-line header comment saying **why it exists**.
- Validation rules are declared **once**, in a single shared schema module, and
  imported by both client and server. Never duplicate a rule in two places.
- No magic numbers or hardcoded model names, TTLs, limits, or timeouts inside
  route handlers. They go in a config module.
- Prefer explicit over clever. If a reviewer would have to pause to work out
  what a line does, rewrite it.
- Keep files short. If a file passes ~200 lines, propose a split.
- Name things so the brief's vocabulary is visible in the code: if the brief
  says "verification code expiry", the column is not called `exp2`.

## Database

- Constraints are part of the design, not an afterthought. When you propose a
  table, state which constraints make an invalid state impossible.
- Every query that touches user-owned data is scoped to the authenticated user
  **inside the query**. Never fetch then check ownership afterwards.
- Index the columns you filter and sort on, and tell me why each index exists.

## Commits

- Small, incremental, conventional commits. One logical change per commit.
- Commit history is graded. Never squash, never force-push over history, never
  produce a single "initial commit" containing everything.
- Commit message body should say *why*, not restate the diff.

## Testing and honesty

- Do not test only the happy path. For each flow, tell me the failure cases you
  have not exercised.
- Never claim something works that you have not run. If you have not verified
  it, say "not verified".
- A 200 response is not proof the work succeeded when the work happens in a
  background job.