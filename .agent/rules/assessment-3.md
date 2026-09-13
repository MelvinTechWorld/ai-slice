# Assessment 3 — The AI Integration Slice (working rules)

Full spec: `.agent/rules/brief-full.md`, section "ASSESSMENT 3".
Time budget: **18–22 hours.**

---

## Scope, in one line

Upload → background job → model → structured output → result view, plus one
follow-up action on the result.

Domain is my choice and does not matter. What matters: a real model, running in
the background, returning structured data, with failures recorded honestly.

---

## Build order

1. **Config module first.** Every changeable value lives here from the very
   first line of code: model identifiers, timeouts, output token caps,
   temperature, rate limits, concurrency cap, file size limit, allowed MIME
   types. Nothing tunable ever appears in a handler.
2. **`.env.example` with commented placeholders.** I type real keys by hand.
3. **Schema.** `jobs` table with status, attempts, error message. `files` or
   equivalent holding only the storage key.
4. **Storage layer.** Object storage or a documented local equivalent. The
   database holds a key, never bytes.
5. **Upload endpoint** with size and MIME type enforcement, rate limited.
   Returns immediately having enqueued a job.
6. **Queue / worker** with the concurrency cap.
7. **Output schema + validator.** Written in my own code, not delegated wholly
   to the provider's schema enforcement.
8. **Role 1 system prompt** and its model call, with timeout and fallback.
9. **Retry + graceful failure path.** Designed UX, not an error string.
10. **Role 2** — second model, or same model with a distinct system prompt
    serving a distinct role.
11. **Status view** honestly reflecting pending / processing / done / failed.
12. **Result view + follow-up action**, rate limited.
13. **Adversarial testing**: empty file, corrupted file, file at exactly the
    size limit, file one byte over, wrong MIME type, provider timeout,
    malformed model response.
14. **Evidence capture.**
15. `DOCUMENTATION.md`.

---

## Decision points — raise these with me before coding

| Decision | Alternatives you must present |
|---|---|
| Provider(s) and models | Which two roles, which model each, and why |
| Two models vs two prompts | Routed by task vs one model, two system prompts |
| Temperature per role | The value, and what changes at 0 vs 0.7 vs 1 |
| Output token cap | The number, and what gets truncated if it is hit |
| Timeout per call | The seconds, and what the fallback does |
| Retry policy | How many, what backoff, and when to stop |
| Structured output mechanism | Provider schema mode vs tool/function call vs prompt-and-parse |
| Validation library | Whatever your stack offers |
| Queue implementation | In-process vs database-backed vs external broker |
| Concurrency cap value | The number, and the reasoning behind it |
| Storage | S3-compatible vs local dev equivalent, and how the latter is documented |
| File size limit and MIME allowlist | The values, and what a user sees when they exceed them |
| Failure UX | What the user is actually told, word for word |

---

## Anti-patterns — do not do these

- **Writing API keys.** You never write a real key into any file. Tell me the
  variable name and stop. This is explicitly called out as a trap in the brief.
- **Hardcoding the model name or token limit in the handler.** Both live in the
  config module.
- **Parsing prose with string operations** instead of requesting structured
  output. No regex over model prose, no `split(':')`, no "find the line that
  starts with".
- **Testing with three clean inputs.** The brief names empty, corrupted, and
  at-the-size-limit specifically. Test all three.
- **Storing the uploaded file in the database.** Key only.
- **Believing a 200 means the work succeeded.** The work happens in the job. The
  job is where the failure lives, and the failure must be recorded and visible.
- Trusting the provider's schema enforcement alone. Validate on receipt in my
  own code — this is what separates Pass from Excellent.

---

## Evidence checklist

Capture into `/evidence/`.

- [ ] **Jobs table** showing one successful run and one failed run, with the
      error message visible on the failure row.
      → capture at step 13
- [ ] **Raw model output** for one request, alongside the validated, parsed
      result. Two artefacts side by side.
      → capture at step 7
- [ ] **Validation failure in action** — deliberately break the schema or the
      response and show what happens: the retry, then the graceful failure, then
      what the user sees.
      → capture at step 9
- [ ] **Concurrency cap holding** — upload enough files at once and show the
      provider request pattern. Timestamps or a log showing N in flight, not
      fifty. The brief wants this *demonstrated, not asserted*.
      → capture at step 6
- [ ] **Database holding only a storage key**, not the file.
      → capture at step 4

---

## Section 5 concepts — I must cover all ten

What an API endpoint is · SDKs vs raw HTTP, and why official SDKs · System
prompts vs user prompts · Model parameters, the ones I set and why · Structured
output and schema validation, including what happens when validation fails ·
Jobs and workers · Queues, FIFO, and why concurrency is capped · Rate limiting
as a cost control · Why files live in object storage rather than the database ·
**My cost model** — what one run costs approximately, and what caps the total

The cost model needs **real numbers** for the Excellent band. Track token usage
during testing so I have actuals rather than estimates.

---

## Defence questions — I will be asked these out loud

1. Justify your temperature setting and your output token cap.
2. Show me what a user sees when the provider times out.
3. Your model returns something that fails validation. Trace what happens next,
   line by line.
4. I upload fifty files and press the button. What exactly happens, and what
   stops it costing you fifty simultaneous calls?

Question 2 wants the screen, not the code path. Have the failure UX built well
enough to demonstrate live.
