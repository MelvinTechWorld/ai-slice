// app/api/receipts/[id]/route.ts
//
// Powers the processing-state and result screens: polled by the client
// while the extraction job is PENDING/PROCESSING, and once to render the
// result when DONE. Every query is scoped to the authenticated user in
// the query itself — a receipt that isn't yours returns 404, not someone
// else's data.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const receipt = await prisma.receipt.findFirst({
    where: { id, userId: user.id },
    include: {
      jobs: { orderBy: { createdAt: "desc" } },
      extraction: true,
      followups: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!receipt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const extractionJob = receipt.jobs.find((j) => j.type === "EXTRACTION");
  const latestFollowupJob = receipt.jobs.find((j) => j.type === "FOLLOWUP");
  const latestFollowupResult = receipt.followups[0] ?? null;

  return NextResponse.json({
    receipt: {
      id: receipt.id,
      originalFilename: receipt.originalFilename,
      createdAt: receipt.createdAt,
    },
    extraction: {
      status: extractionJob?.status ?? "PENDING",
      errorMessage: extractionJob?.errorMessage ?? null,
      result: receipt.extraction
        ? {
            merchant: receipt.extraction.merchant,
            totalMinor: receipt.extraction.totalMinor,
            currency: receipt.extraction.currency,
            purchaseDate: receipt.extraction.purchaseDate,
            lineItems: receipt.extraction.lineItems,
          }
        : null,
    },
    followup: latestFollowupJob
      ? {
          status: latestFollowupJob.status,
          errorMessage: latestFollowupJob.errorMessage,
          action: latestFollowupJob.action,
          resultText: latestFollowupResult?.resultText ?? null,
        }
      : null,
  });
}
