// lib/ai/config.ts
//
// Every changeable value for the AI slice lives here. Handlers and workers
// import from this file and hold no literals of their own.
//
// Each parameter carries a one-line justification, which Section 5 of
// DOCUMENTATION.md quotes directly.

import { ThinkingLevel } from "@google/genai";

const num = (value: string | undefined, fallback: number) =>
    value === undefined ? fallback : Number(value);

export const AI_CONFIG = {
    roles: {
        // Receipt image or PDF -> structured line items.
        extraction: {
            // Flash tier: the only vision-capable models on the free tier, and the
            // only ones that accept PDF alongside images.
            model: process.env.EXTRACTION_MODEL ?? "gemini-3-flash",
            // Zero: extraction is transcription, not authorship. Any creativity here
            // is a wrong total on someone's receipt.
            temperature: 0,
            // Extraction is deterministic transcription, not reasoning — there is
            // nothing to "think through" on a receipt. Gemini 3 Flash Preview
            // defaults to thinking mode, which burns output-token budget on
            // internal reasoning before writing the answer; a low thinking level
            // on a task this simple avoids wasting tokens we need for the actual
            // JSON, and avoids the response being truncated mid-object.
            thinkingLevel: ThinkingLevel.LOW,
            // ~30 line items of JSON. Raised from 1024 after a truncated-response
            // failure (see Section 6) — thinking mode was consuming most of the
            // original budget before any JSON was written.
            maxOutputTokens: num(process.env.EXTRACTION_MAX_TOKENS, 2048),
            // A receipt that has not returned in 30s is not going to.
            timeoutMs: num(process.env.EXTRACTION_TIMEOUT_MS, 30_000),
            // Three attempts covers a transient 429 or one malformed response;
            // beyond that the input is the problem, not the call.
            maxAttempts: num(process.env.EXTRACTION_MAX_ATTEMPTS, 3),
        },

        // Extracted JSON -> short human-readable summary / rephrase / expansion.
        followup: {
            // Lite tier: text-only work at the higher request ceiling of the two
            // free-tier models, which is where the user-triggered traffic lands.
            model: process.env.FOLLOWUP_MODEL ?? "gemini-3.1-flash-lite",
            // Slightly above zero: this output is read by a human and flat
            // deterministic phrasing reads worse, but the facts are already fixed
            // upstream so the risk is presentational only.
            temperature: 0.4,
            // A summary longer than this is not a summary.
            maxOutputTokens: num(process.env.FOLLOWUP_MAX_TOKENS, 512),
            // User is waiting on this one, so it fails faster than extraction.
            timeoutMs: num(process.env.FOLLOWUP_TIMEOUT_MS, 20_000),
            maxAttempts: num(process.env.FOLLOWUP_MAX_ATTEMPTS, 2),
        },
    },

    queue: {
        // Sized under the free-tier requests-per-minute ceiling so a bulk upload
        // degrades into a slower queue rather than a wall of 429s.
        concurrency: num(process.env.QUEUE_CONCURRENCY, 3),
        // Exponential backoff base; jitter prevents retries synchronising into a
        // second burst that trips the same limit again.
        backoffBaseMs: num(process.env.QUEUE_BACKOFF_BASE_MS, 1_000),
        backoffJitterMs: num(process.env.QUEUE_BACKOFF_JITTER_MS, 250),
    },

    rateLimits: {
        // The expensive endpoint: each accepted request becomes a provider call.
        processTrigger: {
            windowMs: num(process.env.RL_PROCESS_WINDOW_MS, 60_000),
            max: num(process.env.RL_PROCESS_MAX, 10),
        },
        // Cheaper per call, but trivially repeatable by clicking, so capped tighter
        // per minute than the upload path.
        followupAction: {
            windowMs: num(process.env.RL_FOLLOWUP_WINDOW_MS, 60_000),
            max: num(process.env.RL_FOLLOWUP_MAX, 5),
        },
    },

    uploads: {
        // Above this, the image adds tokens without adding legible detail.
        maxBytes: num(process.env.UPLOAD_MAX_BYTES, 8 * 1024 * 1024),
        // Enforced server-side on the actual file content, not on the declared
        // MIME type or the extension.
        allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf",
        ],
        // Bounds the worst-case burst one user can create in a single action.
        maxFilesPerRequest: num(process.env.UPLOAD_MAX_FILES, 10),
    },

    storage: {
        bucket: process.env.STORAGE_BUCKET ?? "",
        keyPrefix: process.env.STORAGE_KEY_PREFIX ?? "receipts/",
        // Result URLs are short-lived so a leaked link is not a permanent one.
        signedUrlTtlSeconds: num(process.env.STORAGE_URL_TTL, 300),
    },
} as const;

export type AiRole = keyof typeof AI_CONFIG.roles;
export type RoleConfig = (typeof AI_CONFIG.roles)[AiRole];