// lib/auth/session.ts
//
// Assessment 1 checks the session inline inside the dashboard page
// component (cookies() -> Session lookup -> User lookup -> redirect),
// using Prisma 8's contract API. Same logic here, extracted into a
// reusable function so API routes can use it too, and rewritten against
// this repo's classic Prisma 6 client.

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;

    if (!sessionId) return null;

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.expiresAt.getTime() < Date.now()) return null;

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    return user;
}