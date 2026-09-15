// app/api/auth/signup/route.ts
//
// Copied and converted from Assessment 1. Logic unchanged — idempotency
// via the unique constraint on email, rate limiting, verification code
// generation with a 15-minute TTL. Only the database access layer changed:
// db.orm.public.X.create(...) [Prisma 8 rc] -> prisma.x.create({ data: ... })
// [Prisma 6, this repo's actual setup].

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signupSchema } from '@/lib/validations/auth';
import { hashPassword } from '@/lib/auth/password';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
        const rateLimit = await checkRateLimit(ip, 'signup', 5, 900);
        if (!rateLimit.success) {
            return rateLimitResponse(rateLimit.reset);
        }

        const body = await request.json();

        // 1. Validate input against the shared schema
        const result = signupSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { email, name, password } = result.data;

        // 2. Hash password
        const hashedPassword = await hashPassword(password);

        let user;
        try {
            // 3. Create user (idempotency via unique database constraint on email)
            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    passwordHash: hashedPassword,
                },
            });
        } catch (error: any) {
            // Prisma code P2002 is "Unique constraint failed"
            if (error?.code === 'P2002' || error?.message?.includes('Unique constraint failed')) {
                return NextResponse.json(
                    { error: 'An account with that email already exists' },
                    { status: 409 } // Conflict
                );
            }
            throw error; // Re-throw unhandled DB errors
        }

        // 4. Generate 6-digit verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // 15 minutes TTL
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        const now = new Date();

        await prisma.verificationCode.create({
            data: {
                userId: user.id,
                code,
                expiresAt,
                lastSentAt: now,
            },
        });

        // 5. TODO: Send email containing the code via a provider (Resend, etc.)
        // For local development and to pass the test without a real provider yet:
        console.log(`[Email Mock] Verification code for ${email} is: ${code}`);

        return NextResponse.json(
            { message: 'Account created successfully. Please check your email for the verification code.' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}