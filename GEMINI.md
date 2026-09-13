# GEMINI.md — Antigravity-specific rules

<!--
Antigravity reads this file at highest priority, above AGENTS.md.
Keep it short. It exists to restate the rules that cost me marks if broken.
Everything else lives in AGENTS.md and .agent/rules/.
-->

Read `AGENTS.md` and `.agent/rules/assessment-N.md` before your first action in
this repository. The authoritative spec is `.agent/rules/brief-full.md`.

## The four rules that override everything else

1. **Never write a real secret.** Not into `.env`, not into any file, not into a
   comment. Placeholders in `.env.example` only. If you need a key, name the
   variable and stop.

2. **Never choose silently.** Before picking a library, algorithm, constraint,
   status code, or any tunable number, present the options and the tradeoff and
   **wait for my answer**. Then log it in `docs/decisions.md`. See the decision
   protocol in `AGENTS.md`.

3. **Never build outside the brief.** No landing page, no marketing page, no
   extra features, no fake data. A placeholder dashboard is one line of text and
   a sign-out button.

4. **Never write Sections 1, 5, 6, 7, or 8 of `DOCUMENTATION.md`.** Those are
   mine. You may draft Sections 2, 3, and the schema half of 4.

## Working style

- Plan before you build. Show me the plan and the files you intend to touch.
- One task at a time. Commit between tasks.
- After any feature that produces required evidence, stop and remind me to
  capture it before continuing.
- If you have not run something, say "not verified". Do not report success you
  have not observed.
- Prefer explicit code over clever code. Everything here has to be defensible
  out loud, line by line.

## Browser use

When you use the browser to verify a flow, capture what you see and tell me
whether it matches the brief's required behaviour — not just whether the page
rendered.
