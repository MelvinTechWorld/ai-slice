// lib/rate-limit.ts
//
// Same signature and behaviour as Assessment 1's rate limiter, rewritten
// from Prisma 8's contract API (db.orm.public.RateLimit.where(...).first())
// to this repo's classic Prisma 6 client (prisma.rateLimit.findUnique).

import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

interface RateLimitResult {
    success: boolean;
    reset: Date;
}

export async function checkRateLimit(
    ip: string,
    action: string,
    limit: number,
    windowSeconds: number
): Promise<RateLimitResult> {
    const key = `${action}:${ip}`;
    const now = Date.now();

    const record = await prisma.rateLimit.findUnique({ where: { key } });

    if (record && record.expiresAt.getTime() > now) {
        if (record.points >= limit) {
            return { success: false, reset: record.expiresAt };
        }

        await prisma.rateLimit.update({
            where: { key },
            data: { points: record.points + 1 },
        });

        return { success: true, reset: record.expiresAt };
    }

    if (record) {
        await prisma.rateLimit.delete({ where: { key } });
    }

    const reset = new Date(now + windowSeconds * 1000);
    try {
        await prisma.rateLimit.create({
            data: { key, points: 1, expiresAt: reset },
        });
    } catch (error: any) {
        // Concurrent request already created the window — treat as success
        // rather than crashing the upload.
        if (error?.code === "P2002") {
            return { success: true, reset };
        }
        throw error;
    }

    return { success: true, reset };
}

export function rateLimitResponse(reset: Date) {
    const retryAfterSeconds = Math.max(
        1,
        Math.ceil((reset.getTime() - Date.now()) / 1000)
    );
    return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": retryAfterSeconds.toString() } }
    );
}