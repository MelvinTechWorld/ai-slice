// app/api/auth/signout/route.ts
//
// Copied and converted from Assessment 1. Only the database access layer
// changed: db.orm.public.Session.where(...).delete() [Prisma 8 rc]
// -> prisma.session.delete({ where: ... }) [Prisma 6, this repo].

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get('sessionId')?.value;

        if (sessionId) {
            // Delete session from DB. Ignore "not found" — a session that's
            // already gone (expired cleanup, double sign-out click) still
            // ends in the same signed-out state.
            await prisma.session.delete({ where: { id: sessionId } }).catch(() => { });

            // Delete cookie
            cookieStore.delete('sessionId');
        }

        return NextResponse.redirect(new URL('/signin', request.url));
    } catch (error) {
        console.error('Signout error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}