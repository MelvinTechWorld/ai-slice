// app/api/auth/verify/route.ts
//
// Copied and converted from Assessment 1. Logic unchanged — code match,
// database-backed expiry check, delete-then-session-create on success.
// Database access layer changed to classic Prisma 6. Note: VerificationCode
// has no unique constraint on userId (a user could have had more than one
// issued over time), so .where({userId}).first() becomes findFirst, not
// findUnique.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyEmailSchema } from '@/lib/validations/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = verifyEmailSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { email, code } = result.data;

        // Find the user by email
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
        }

        // Find the verification code for this user
        const verificationCode = await prisma.verificationCode.findFirst({
            where: { userId: user.id },
        });
        if (!verificationCode) {
            return NextResponse.json({ error: 'No verification code found' }, { status: 400 });
        }

        // Check if it matches
        if (verificationCode.code !== code) {
            return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
        }

        // Check if it's expired — checked against the database record, not
        // just an interface countdown, per the brief's explicit requirement.
        if (verificationCode.expiresAt.getTime() < Date.now()) {
            return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
        }

        // Success! Delete the code
        await prisma.verificationCode.delete({ where: { id: verificationCode.id } });

        // Create session (DB-backed)
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const session = await prisma.session.create({
            data: {
                userId: user.id,
                expiresAt,
            },
        });

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set('sessionId', session.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        });

        return NextResponse.json(
            { message: 'Email verified successfully. You are now logged in.' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Verify error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}