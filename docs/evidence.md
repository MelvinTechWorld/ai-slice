# Evidence Log

Every piece of captured proof required by the brief, logged when captured.

**Why this file exists:** the briefs require database screenshots, curl output,
and measurement tables that cannot be reconstructed after the fact. Assessment 2
states outright that *claims without screenshots do not count*. Assessment 4's
baseline query counts are gone forever once the code is optimised.

**Where files go:** `/evidence/` in the repository root. Reference them from
`DOCUMENTATION.md` with relative paths so they render on GitHub.

**Naming:** `NN-short-description.png` — e.g. `01-users-table-hash.png`. Number
them in the order the brief lists them so a reviewer can follow along.

---

## Captured

| # | File | What it shows | Which requirement it satisfies | Date |
|---|---|---|---|---|
| 01 | `01-jobs-table-success-and-failure.png` | Job table showing a DONE extraction, a DONE followup, and a FAILED extraction with a real errorMessage | "A screenshot of your jobs table showing a successful run and a failed run, with the error message visible on the failure" | 15 Sep 2026 |
| 02 | `02-failed-extraction-retry-log.png` | Worker terminal showing 3 retry attempts on a deliberately truncated response (EXTRACTION_MAX_TOKENS set to 100), then the job marked FAILED | "Evidence of what happens when validation fails, produced by deliberately breaking the schema or the response" | 15 Sep 2026 |
| 03 | `03-extraction-result-parsed.png` | ExtractionResult row showing merchant, totalMinor, currency after validation | "The raw model output for one request alongside your validated, parsed result" (parsed half) | 15 Sep 2026 |
| 04 | `04-extraction-result-raw-json.png` | Same row's expanded rawResponse column — the actual unmodified Gemini output | "The raw model output for one request alongside your validated, parsed result" (raw half) | 15 Sep 2026 |
| 05 | `05-receipt-table-storage-key-only.png` | Receipt table columns: storageKey, originalFilename, mimeType, sizeBytes — no file-content column exists | "A screenshot showing the database holds only a storage key, not the file" (database half) | 15 Sep 2026 |
| 06 | `06-r2-object-matching-storage-key.png` | R2 bucket object at the same storage key, same file size (118.68 kB) as the database row | "A screenshot showing the database holds only a storage key, not the file" (storage half) | 15 Sep 2026 |
| 07 | `07-concurrency-cap-worker-log.png` | Worker terminal: 5 uploads fired in a burst, processed in batches of 3 (the configured concurrency cap), not all 5 at once | "Your concurrency cap holding, demonstrated by uploading enough files at once and showing the provider request pattern" | 15 Sep 2026 |

## Curl commands used

Record the exact command and the exact response. Both are graded.

### [Name of the thing being tested]

```bash
# Command:


# Response:


# What this proves:

```

---

## Outstanding

## Outstanding

All five required evidence items from Assessment 3's "Prove it works" list are captured (above, items 01–07 covering the 5 requirements — two items each for the raw/parsed pairing and the storage-key proof). None outstanding.

