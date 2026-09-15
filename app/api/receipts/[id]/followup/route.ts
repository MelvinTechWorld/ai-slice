// app/api/receipts/[id]/followup/route.ts
//
// The one user-triggered follow-up action on the result. Rate limited
// separately from the upload endpoint per the brief's requirement, scoped
// to the owning user, and refuses to queue a follow-up before extraction
// has actually finished — there's nothing to summarise yet otherwise.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { AI_CONFIG } from "@/lib/ai/config";

const followupActionSchema = z.object({
  action: z.enum(["summarize", "rephrase", "expand"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await checkRateLimit(
    ip,
    "followup",
    AI_CONFIG.rateLimits.followupAction.max,
    AI_CONFIG.rateLimits.followupAction.windowMs / 1000
  );
  if (!rl.success) {
    return rateLimitResponse(rl.reset);
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = followupActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid action", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const receipt = await prisma.receipt.findFirst({
    where: { id, userId: user.id },
    include: { extraction: true },
  });

  if (!receipt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!receipt.extraction) {
    return NextResponse.json(
      { error: "Extraction has not finished yet" },
      { status: 409 }
    );
  }

  const job = await prisma.job.create({
    data: {
      receiptId: receipt.id,
      type: "FOLLOWUP",
      action: parsed.data.action,
      status: "PENDING",
    },
  });

  return NextResponse.json({ jobId: job.id, status: "PENDING" }, { status: 202 });
}
