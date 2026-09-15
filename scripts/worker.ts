// scripts/worker.ts
//
// Standalone polling worker. Run in a second terminal alongside `npm run
// dev`, via `npm run worker`. This is the queue: it polls the Job table
// for PENDING rows, claims up to AI_CONFIG.queue.concurrency at a time,
// and processes them.
//
// Currently STUBBED: sleeps for 2s and marks each job DONE. No model call
// yet. The point of building it this way is to prove the queue mechanics —
// polling, the concurrency cap, PENDING -> PROCESSING -> DONE/FAILED — work
// correctly before Gemini is anywhere in the picture. Swap the stub in
// processJob() for the real extraction call once this is verified.
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

const POLL_INTERVAL_MS = 3000;

async function claimNextJobs(limit: number) {
    const jobs = await prisma.job.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" }, // FIFO
        take: limit,
    });

    if (jobs.length === 0) return [];

    await prisma.job.updateMany({
        where: { id: { in: jobs.map((j) => j.id) } },
        data: { status: "PROCESSING", startedAt: new Date() },
    });

    return jobs;
}

async function processJob(job: { id: string; type: string }) {
    console.log(`[worker] processing job ${job.id} (${job.type})`);

    // STUB — replace with the real Gemini extraction/followup call.
    await new Promise((resolve) => setTimeout(resolve, 2000));

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
        await tick();
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
}

main().catch((err) => {
    console.error("[worker] fatal error:", err);
    process.exit(1);
});