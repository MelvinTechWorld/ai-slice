# Decision Log

Every non-obvious choice made in this repository, recorded when it was made.

**Why this file exists:** Section 5 of `DOCUMENTATION.md` requires four answers
per concept, and the fourth is *what I chose against, and why*. That question is
unanswerable a week later if the choice was made silently. This file is filled in
at the moment of the decision so that writing Section 5 is a reformatting job,
not an archaeology job.

**The rule:** the agent proposes options and never chooses. I choose, and the
"why" below is written in my own words. An agent-written "why" is worth nothing
at the defence.

---

## Template — copy this for each decision

```
## [Decision name — use the same name as the Section 5 concept where possible]

- **Date:**
- **What it is (my words, 2–3 sentences, as if to someone who has never heard the term):**
- **What breaks without it (concrete, name the failure, no "so it's secure"):**
- **What I chose:**
- **What I chose against:**
- **Why (the real reason, including "it was the one I could reason about"):**
- **Where it lives:** `path/to/file.ts`
- **Tunable values set, and why those numbers:**
- **Was this choice forced? If so, by what:**
```

Those fields map onto Section 5's four questions directly:

| Field here | Section 5 question |
|---|---|
| What it is | 1. What it is |
| What breaks without it | 2. Why it is needed |
| What I chose + where it lives + tunables | 3. How I implemented it |
| What I chose against + why | 4. What I chose against, and why |

---

## Decisions

<!--
Append below, newest at the bottom. Do not delete entries when you change your
mind — add a new entry that supersedes the old one and say so. A reversed
decision is good Section 6 material.
-->

## [First decision goes here]

- **Date:**
- **What it is (my words):**
- **What breaks without it:**
- **What I chose:**
- **What I chose against:**
- **Why:**
- **Where it lives:**
- **Tunable values set, and why those numbers:**
- **Was this choice forced? If so, by what:**
