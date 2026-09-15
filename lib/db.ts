// lib/db.ts
//
// Prisma client singleton, classic Prisma 6 API (prisma.user.findUnique,
// prisma.receipt.create, etc.) — not Assessment 1's Prisma 8 rc
// contract-based db.orm.public.X.where().first() pattern. See
// docs/decisions.md: this repo is pinned to the last stable Prisma major
// rather than the release candidate Assessment 1 used, so a fresh clone
// doesn't depend on pre-release behaviour.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}