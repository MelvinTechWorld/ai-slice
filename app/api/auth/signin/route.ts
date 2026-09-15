// app/api/auth/signin/route.ts
//
// Copied and converted from Assessment 1. Logic unchanged — rate limiting,
// password verification, 7-day session with httpOnly cookie. Only the
// database access layer changed:
// db.orm.public.X.where(...).first() / .create(...) [Prisma 8 rc]
// -> prisma.x.findUnique(...) / .create({ data: ... }) [Prisma 6, this repo].

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signinSchema } from '@/lib/validations/auth';
import { verifyPassword } from '@/lib/auth/password';
import { cookies } from 'next/headers';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
        const rateLimit = await checkRateLimit(ip, 'signin', 5, 900);
        if (!rateLimit.success) {
            return rateLimitResponse(rateLimit.reset);
        }

        const body = await request.json();
        const result = signinSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { email, password } = result.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const session = await prisma.session.create({
            data: {
                userId: user.id,
                expiresAt,
            },
        });

        const cookieStore = await cookies();
        cookieStore.set('sessionId', session.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        });

        return NextResponse.json(
            { message: 'Signed in successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Signin error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}