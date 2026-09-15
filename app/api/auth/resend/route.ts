// app/api/auth/resend/route.ts
//
// Copied and converted from Assessment 1. Logic unchanged — two layers of
// throttling: a general rate limit (5 per 15 min per IP) plus a
// database-backed 60-second cooldown checked against lastSentAt, not an
// interface timer. Also doesn't reveal whether an email exists (same
// response either way) to avoid leaking account existence. Database
// access layer changed to classic Prisma 6.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

const resendSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
        const rateLimit = await checkRateLimit(ip, 'resend', 5, 900);
        if (!rateLimit.success) {
            return rateLimitResponse(rateLimit.reset);
        }

        const body = await request.json();
        const result = resendSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { email } = result.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Don't reveal whether user exists for security, just pretend success
            return NextResponse.json({ message: 'If that email exists, a new code has been sent.' }, { status: 200 });
        }

        const existingCode = await prisma.verificationCode.findFirst({
            where: { userId: user.id },
        });

        const now = Date.now();

        if (existingCode) {
            // Check 60 second cooldown — enforced against the database's
            // lastSentAt, not a client-side countdown.
            const lastSentTime = existingCode.lastSentAt.getTime();
            const timeSinceLastSent = now - lastSentTime;
            if (timeSinceLastSent < 60 * 1000) {
                const retryAfterSeconds = Math.max(1, Math.ceil((60 * 1000 - timeSinceLastSent) / 1000));
                return NextResponse.json(
                    { error: 'Please wait before requesting another code.' },
                    {
                        status: 429,
                        headers: {
                            'Retry-After': retryAfterSeconds.toString(),
                        },
                    }
                );
            }
            // Delete existing code
            await prisma.verificationCode.delete({ where: { id: existingCode.id } });
        }

        // Generate new code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(now + 15 * 60 * 1000);
        const nowDate = new Date(now);

        await prisma.verificationCode.create({
            data: {
                userId: user.id,
                code,
                expiresAt,
                lastSentAt: nowDate,
            },
        });

        console.log(`[Email Mock] RESENT Verification code for ${email} is: ${code}`);

        return NextResponse.json(
            { message: 'If that email exists, a new code has been sent.' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Resend error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}