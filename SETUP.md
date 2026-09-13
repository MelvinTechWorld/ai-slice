# Setup — how to install and use this kit

Everything in this kit goes into **each of your four repositories**. Set it up
once for Assessment 1, then copy it forward.

---

## What's in here

```
AGENTS.md                      → repo root. The scope fence. Read by Antigravity, Cursor, Claude Code.
GEMINI.md                      → repo root. Antigravity-only, highest priority. Short.
DOCUMENTATION.template.md      → rename to DOCUMENTATION.md at repo root.
.env.example                   → repo root. Placeholders only, committed.
.agent/rules/brief-full.md     → the whole assessment PDF as markdown. The spec.
.agent/rules/assessment-1.md   → working plan for A1: build order, decisions, evidence.
.agent/rules/assessment-2.md   → same, for A2.
.agent/rules/assessment-3.md   → same, for A3.
.agent/rules/assessment-4.md   → same, for A4.
docs/decisions.md              → filled in as you go. Feeds Section 5.
docs/evidence.md               → filled in as you go. Tracks captured proof.
docs/linkedin.md               → post draft with the structure the brief wants.
evidence/                      → screenshots and curl output live here.
```

---

## Step 1 — Set up repository one

```bash
# Scaffold your project first, however you normally do it, then:
cd your-auth-slice-repo

# Copy the kit in
cp -r /path/to/agent-kit/. .

# Keep only the assessment you're working on
rm .agent/rules/assessment-2.md .agent/rules/assessment-3.md .agent/rules/assessment-4.md

# Rename the documentation template
mv DOCUMENTATION.template.md DOCUMENTATION.md
```

Then, before anything else:

```bash
# Confirm .env is ignored
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
git check-ignore -v .env    # must print a match. If it prints nothing, stop.
```

## Step 2 — Fill in the two placeholders

Open `AGENTS.md` and fill in:

- **Project Overview** → name, which assessment number
- **Tech Stack** → every line. Do not leave these blank and do not let the agent
  guess. A blank stack section is how you end up with an agent installing a
  second ORM.

That's the only editing the kit needs.

## Step 3 — Turn on nested rules in Antigravity

Settings → Agent → **load nested AGENTS.md files**.

Antigravity reads rules in priority order: `GEMINI.md` first (Antigravity-only,
highest priority), then `AGENTS.md` (shared with Cursor and Claude Code), then
`.agent/rules/` as workspace supplements. Global rules, if you want any, live at
`~/.gemini/GEMINI.md` or `~/.gemini/AGENTS.md`.

You don't need global rules for this. Everything here is project-scoped on
purpose.

## Step 4 — Your first prompt to the agent

Paste this exactly:

> Read `GEMINI.md`, `AGENTS.md`, `.agent/rules/brief-full.md`, and
> `.agent/rules/assessment-1.md` before doing anything.
>
> Then do three things and stop:
> 1. Confirm back to me, in your own words, what is in scope and what is
>    explicitly out of scope for this repository.
> 2. List the decision points from `assessment-1.md` you need answers to before
>    you can write the schema.
> 3. Propose the first task only. Do not write any code yet.

If it comes back with a plan that includes a landing page, a settings screen, or
a styled dashboard, the rules aren't loading. Check the file locations before
you continue.

## Step 5 — The loop, per task

1. Agent proposes → you approve
2. Agent hits a decision point → it stops and presents options
3. **You choose** → the reason goes in `docs/decisions.md` in your words
4. Agent implements → commits
5. If the task produced required evidence → capture it now, log it in
   `docs/evidence.md`
6. Next task

Steps 3 and 5 are the ones that decide your grade. They're also the two you'll
be tempted to skip.

## Step 6 — Repositories two, three, four

```bash
cd your-payments-slice-repo
cp -r /path/to/agent-kit/. .
rm .agent/rules/assessment-1.md .agent/rules/assessment-3.md .agent/rules/assessment-4.md
mv DOCUMENTATION.template.md DOCUMENTATION.md
```

Update the assessment number in `AGENTS.md`, and re-check `.gitignore`. Fresh
`docs/decisions.md` and `docs/evidence.md` each time — they're per-repository.

---

## On the colour system

You asked about this. Honest answer: it's the lowest-value item on your list for
these particular briefs.

Every brief forbids landing pages, marketing pages, and dashboard design. The
placeholder dashboard is one line of text and a button. There is almost no
surface to apply a design system to, and hours spent outside the brief are
explicitly called out as working against you.

What the briefs actually require on the UI side is accessibility, not aesthetics:

- Assessment 1 — input groups with **labels programmatically bound to inputs**,
  and **visible focus states**
- Assessment 4 — **genuine empty states**, with no placeholder or fake data

So do this once, in about thirty minutes, in the Assessment 1 repo, and copy it
to the other three:

1. Install shadcn/ui. Take the default theme.
2. Pick **one** accent colour. Set it as your primary token. Done.
3. Do not remove the default focus ring. Verify you can tab through every form
   and always see where you are.
4. Use the `<Label htmlFor>` / `<Input id>` pairing on every field. Never a bare
   `<div>` acting as a label.
5. Never add a fake row to make a list look populated.

That's the whole design system. Anything more is time taken from Section 5.

---

## On what you didn't ask about

Two things worth knowing before you start.

**The PRD.** You don't need one. The brief *is* the PRD — it's more specific
than most product specs you'll be handed, right down to the defence questions.
Rewriting it in your own words just introduces drift between what you build and
what's graded. That's why `brief-full.md` is a faithful conversion rather than a
summary.

**The defence.** The grading is code + documentation + a live verbal defence,
and the stated reason for all three is that any two can be produced without the
third being true. An agent can get you through the first two. It cannot sit in
that chair.

So budget one hour per assessment, near the end, where you close Antigravity,
open the repo, and answer the four defence questions out loud to yourself. If
you can't, you don't have the marks yet — regardless of what the code does.
