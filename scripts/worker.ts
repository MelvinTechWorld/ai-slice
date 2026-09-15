// scripts/worker.ts
//
// Standalone polling worker. Run in a second terminal alongside `npm run
// dev`, via `npm run worker`. Polls the Job table for PENDING rows,
// claims up to AI_CONFIG.queue.concurrency at a time, and processes them.
//
// EXTRACTION jobs now call the real Gemini model (lib/ai/gemini.ts) and
// save a validated ExtractionResult. FOLLOWUP jobs remain stubbed until
// the result view exists to trigger them.
//
// Known limitation (goes in Section 7): this assumes exactly one worker
// process running locally. Two workers polling at once could both claim
// the same job, since claiming is a read then a separate update rather
// than one atomic operation. Fine for this slice's local single-worker
// setup; would need a conditional update (claim only if still PENDING) or
// a proper queue (e.g. a Postgres SKIP LOCKED query) before running two
// workers concurrently.

import { prisma } from "../lib/db";
import { AI_CONFIG } from "../lib/ai/config";
import { downloadFromR2 } from "../lib/storage/r2";
import { extractReceipt } from "../lib/ai/gemini";
import type { Job, Receipt } from "@prisma/client";

const POLL_INTERVAL_MS = 3000;

type JobWithReceipt = Job & { receipt: Receipt };

async function claimNextJobs(limit: number): Promise<JobWithReceipt[]> {
    const jobs = await prisma.job.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" }, // FIFO
        take: limit,
        include: { receipt: true },
    });

    if (jobs.length === 0) return [];

    await prisma.job.updateMany({
        where: { id: { in: jobs.map((j) => j.id) } },
        data: { status: "PROCESSING", startedAt: new Date() },
    });

    return jobs;
}

async function processJob(job: JobWithReceipt) {
    console.log(`[worker] processing job ${job.id} (${job.type})`);

    if (job.type === "EXTRACTION") {
        const fileBuffer = await downloadFromR2(job.receipt.storageKey);
        const { raw, parsed } = await extractReceipt(fileBuffer, job.receipt.mimeType);

        await prisma.extractionResult.upsert({
            where: { receiptId: job.receiptId },
            create: {
                receiptId: job.receiptId,
                rawResponse: raw as any,
                merchant: parsed.merchant,
                totalMinor: parsed.totalMinor,
                currency: parsed.currency,
                purchaseDate: parsed.purchaseDate ? new Date(parsed.purchaseDate) : null,
                lineItems: parsed.lineItems as any,
            },
            update: {
                rawResponse: raw as any,
                merchant: parsed.merchant,
                totalMinor: parsed.totalMinor,
                currency: parsed.currency,
                purchaseDate: parsed.purchaseDate ? new Date(parsed.purchaseDate) : null,
                lineItems: parsed.lineItems as any,
            },
        });
    } else {
        // FOLLOWUP — stubbed until the result view exists to trigger it.
        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    await prisma.job.update({
        where: { id: job.id },
        data: { status: "DONE", completedAt: new Date() },
    });

    console.log(`[worker] done job ${job.id}`);
}

async function tick() {
    const jobs = await claimNextJobs(AI_CONFIG.queue.concurrency);

    await Promise.all(
        jobs.map((job) =>
            processJob(job).catch(async (err) => {
                console.error(`[worker] job ${job.id} failed:`, err);
                await prisma.job.update({
                    where: { id: job.id },
                    data: {
                        status: "FAILED",
                        errorMessage: err instanceof Error ? err.message : String(err),
                        completedAt: new Date(),
                    },
                });
            })
        )
    );
}

async function main() {
    console.log(`[worker] starting, polling every ${POLL_INTERVAL_MS}ms, concurrency ${AI_CONFIG.queue.concurrency}`);
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            await tick();
        } catch (err) {
            // A transient DB hiccup (e.g. Neon's serverless compute waking up)
            // should not kill the whole worker. Log it and keep polling —
            // this is what makes the worker resilient rather than needing a
            // manual restart every time the connection blips.
            console.error("[worker] tick failed, will retry next poll:", err);
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
}

main().catch((err) => {
    console.error("[worker] fatal error:", err);
    process.exit(1);
});