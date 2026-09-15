// app/api/auth/reset-password/route.ts
//
// Copied and converted from Assessment 1. Logic unchanged — token looked
// up by its hash, checked against the database's expiresAt (not just
// rejected client-side), and made single-use by deleting all of the
// user's reset tokens after a successful reset (not just the one that
// was used) — this also invalidates every existing session, so a stolen
// session can't survive a password reset. Database access layer changed
// to classic Prisma 6: single-row deletes on a non-unique column
// (userId) become deleteMany, since Session and PasswordResetToken have
// no unique constraint on userId — a user can have several of each.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resetPasswordSchema } from '@/lib/validations/auth';
import { hashPassword } from '@/lib/auth/password';
import crypto from 'crypto';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = resetPasswordSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { token, password } = result.data;

        // Hash the provided token to compare with DB
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // tokenHash is @unique on PasswordResetToken, so findUnique is valid here.
        const resetTokenRecord = await prisma.passwordResetToken.findUnique({
            where: { tokenHash },
        });

        if (!resetTokenRecord) {
            return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
        }

        // Check expiry — against the database record, not an interface timer.
        if (resetTokenRecord.expiresAt.getTime() < Date.now()) {
            return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
        }

        // Hash the new password
        const newPasswordHash = await hashPassword(password);

        // Update user password
        await prisma.user.update({
            where: { id: resetTokenRecord.userId },
            data: { passwordHash: newPasswordHash },
        });

        // Invalidate all existing sessions and reset tokens for this user —
        // this is what makes the token single-use, and also logs out anyone
        // using a stolen session.
        await prisma.session.deleteMany({ where: { userId: resetTokenRecord.userId } });
        await prisma.passwordResetToken.deleteMany({ where: { userId: resetTokenRecord.userId } });

        // Optionally clear their current cookie if they are using it
        const cookieStore = await cookies();
        cookieStore.delete('sessionId');

        return NextResponse.json(
            { message: 'Password reset successfully. You can now sign in with your new password.' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}