# [Slice name] — Documentation

<!--
RENAME THIS FILE TO DOCUMENTATION.md AT THE REPOSITORY ROOT.

Eight sections, in this order, every time. Do not add sections, do not
reorder, do not rename headings.

WHO WRITES WHAT:
  Agent may draft:  Sections 2, 3, and the schema half of 4
  I write myself:   Sections 1, 5, 6, 7, 8 — in my own words

Delete every HTML comment before submitting.
-->

## 1. What This Is

<!--
Two paragraphs, no more.

Para 1 — what the slice does, plain language, as if to a competent person who
has not seen the code.

Para 2 — what is deliberately not included, and why.

If you reused auth from Assessment 1, say so here. Reuse is fine. Hiding it
is not.

Test: after these two paragraphs, does a reader know exactly what they are
about to look at?
-->

## 2. How To Run It

<!--
Numbered steps, fresh clone to running instance. A reviewer who cannot run this
in under ten minutes assumes it does not run.
-->

**Prerequisites**

-

**Steps**

1.

**Environment variables**

| Name | Where it comes from |
|---|---|
| | |

<!-- .env.example must exist in the repo with commented placeholders. -->

**Database setup**

```bash

```

**Start it**

```bash

```

**It appears at:** `http://localhost:____`

## 3. The Flow, Step By Step

<!--
Narrative, not a list of endpoints. For each step, three things:
  - what the user does
  - what the frontend sends
  - what the server does with it
Name the actual route or file for each step.

Test: could a reader finish this section able to predict where in the codebase
any given behaviour lives?
-->

### Step 1 — [what the user does]

**User:**
**Frontend sends:**
**Server does:**
**Lives in:** `path/to/file`

<!-- repeat -->

## 4. The Data Model

<!-- Every table the slice uses. -->

### `table_name`

One line on what it holds:

| Column | Type | Constraint | Decision |
|---|---|---|---|
| | | | |

<!--
The "Decision" column is only for columns that carry one. Why that type. Why
that constraint. Why nullable or not nullable.
-->

### Which constraints make an invalid state impossible?

<!--
Answer this explicitly. I write this part, not the agent.

For each constraint, name what it prevents. A unique constraint, a check
constraint, or a foreign key is not decoration — it is the last line of defence
when the application code has a bug. Naming what each one prevents shows I chose
it rather than accepted it.
-->

## 5. The Concepts

<!--
THE HEART OF THE DOCUMENT. THE MOST HEAVILY GRADED SECTION.

Every concept from the assessment's list gets its own subheading and all four
questions, in this order. No skipping the fourth — it is the question that
separates people who made decisions from people who accepted defaults.

Source material: docs/decisions.md.
Depth expected: see the Password Hashing worked example in the brief.

I WRITE THIS SECTION. Not the agent.
-->

### [Concept name]

**What it is.**
<!-- 2–3 sentences, my own words, as though the reader has never heard the term.
Not a dictionary definition. -->

**Why it is needed.**
<!-- What goes wrong without it. Concrete. Name the failure.
NOT: "so the app is secure"
YES: "someone can send ten thousand login attempts a minute and eventually guess
a password, and each attempt costs me a database query" -->

**How I implemented it.**
<!-- What I actually did, with the file or function named. Code excerpt only
where it helps, ten lines maximum. If it needs more than ten lines, prose. -->

**What I chose against, and why.**
<!-- The alternative I did not take, and the reason. If the choice was genuinely
forced, say so and explain why. -->

<!-- repeat for every concept on the list -->

## 6. What Went Wrong

<!--
Minimum three real problems. Do not sanitise this. A document with no problems
in it reads as either untrue or as work someone else did, and reviewers notice
both.

The dead ends are the valuable part — include the things you checked that turned
out to be irrelevant.

I WRITE THIS SECTION. An agent cannot know what I saw on my screen at 2am.
-->

### Problem 1 — [short name]

**The symptom.**
<!-- What I saw. The actual error, the actual behaviour. -->

**The investigation.**
<!-- What I checked, INCLUDING the things that turned out to be irrelevant. -->

**The cause.**
<!-- What was actually wrong. -->

**The fix.**
<!-- What I changed. -->

### Problem 2 — [short name]

### Problem 3 — [short name]

## 7. What This Slice Does Not Handle

<!--
Honest list of known limitations. This is not a weakness — knowing where your
own work ends is a senior trait, and a reviewer trusts a document more when it
contains one of these.

DISTINGUISH between the last two categories. The brief asks for this explicitly.
-->

**What breaks at scale**

-

**What I would need before real users touched it**

-

**Left out because it was outside the brief**

-

**Left out because I ran out of time**

-

## 8. If I Built This Again

<!--
ONE paragraph. ONE thing. Not a list. Chosen deliberately.

The single biggest thing I would do differently, and why.
-->

---

## Evidence

<!--
The brief's "Prove it works" items. Screenshots live in /evidence/ and are
referenced with relative paths so they render on GitHub. Every image needs a
caption saying what it proves.
-->

### [Evidence item 1]

![caption](./evidence/01-name.png)

**What this shows:**
