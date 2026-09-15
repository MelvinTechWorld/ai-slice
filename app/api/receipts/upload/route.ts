// app/api/receipts/upload/route.ts
//
// Accepts one receipt file, validates it server-side, uploads the bytes to
// R2, and creates a Receipt row plus a PENDING Job row. Returns immediately
// — this route never calls the model. The worker (scripts/worker.ts) picks
// the job up separately.

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { uploadFileSchema } from "@/lib/validation/upload";
import { uploadToR2 } from "@/lib/storage/r2";
import { AI_CONFIG } from "@/lib/ai/config";
import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
    // Protected route: no session, no upload. Reuses Assessment 1's session
    // check, extracted into a callable function — see lib/auth/session.ts.
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting on the endpoint that triggers processing — every accepted
    // request here becomes a real, quota-limited provider call downstream.
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const { success, reset } = await checkRateLimit(
        ip,
        "upload",
        AI_CONFIG.rateLimits.processTrigger.max,
        AI_CONFIG.rateLimits.processTrigger.windowMs / 1000
    );
    if (!success) {
        return rateLimitResponse(reset);
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Server-side validation on the actual file, not the browser's claim
    // about it — mirrors the client-side check but this is the one that
    // actually holds.
    const parsed = uploadFileSchema.safeParse({
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
    });

    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message ?? "Invalid file" },
            { status: 400 }
        );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageKey = `${AI_CONFIG.storage.keyPrefix}${user.id}/${randomUUID()}-${file.name}`;

    // File bytes go to R2. Only the key goes to the database — see
    // ExtractionResult / Receipt schema, no file column exists.
    await uploadToR2(storageKey, buffer, parsed.data.mimeType);

    const receipt = await prisma.receipt.create({
        data: {
            userId: user.id,
            storageKey,
            originalFilename: parsed.data.filename,
            mimeType: parsed.data.mimeType,
            sizeBytes: parsed.data.sizeBytes,
            jobs: {
                create: {
                    type: "EXTRACTION",
                    status: "PENDING",
                },
            },
        },
        include: { jobs: true },
    });

    // 202 Accepted, not 200/201 — the work has not happened yet, only been
    // queued. A 200 here would be exactly the trap the brief warns about.
    return NextResponse.json(
        { receiptId: receipt.id, jobId: receipt.jobs[0].id, status: "PENDING" },
        { status: 202 }
    );
}