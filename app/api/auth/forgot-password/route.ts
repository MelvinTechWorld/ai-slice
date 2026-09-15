// app/api/auth/forgot-password/route.ts
//
// Copied and converted from Assessment 1. Logic unchanged — random token
// generated, only its SHA-256 hash stored (fast hash is correct here,
// unlike passwords: this token is already high-entropy random bytes, not
// something a human chose, so brute-forcing the hash isn't the threat —
// leaking the raw token is, which storing only the hash prevents). Doesn't
// reveal whether the email has an account. Database access layer changed
// to classic Prisma 6.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import crypto from 'crypto';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
        const rateLimit = await checkRateLimit(ip, 'forgot-password', 3, 900);
        if (!rateLimit.success) {
            return rateLimitResponse(rateLimit.reset);
        }

        const body = await request.json();
        const result = forgotPasswordSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { email } = result.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Don't reveal if user exists
            return NextResponse.json(
                { message: 'If an account with that email exists, we have sent a reset link.' },
                { status: 200 }
            );
        }

        // Generate a secure random token
        const token = crypto.randomBytes(32).toString('hex');

        // Hash it for database storage using fast SHA-256
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour TTL

        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt,
            },
        });

        // Send email mock
        const resetLink = `http://localhost:3000/reset-password?token=${token}`;
        console.log(`[Email Mock] Password reset link for ${email} is: ${resetLink}`);

        return NextResponse.json(
            { message: 'If an account with that email exists, we have sent a reset link.' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}