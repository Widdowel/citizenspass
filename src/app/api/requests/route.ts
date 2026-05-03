import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, AuditAction } from "@/lib/audit";
import { ensureKeysForAllAuthorities } from "@/lib/signature";
import { totalPrice } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { type, reason } = await req.json();

  if (!type) {
    return NextResponse.json({ error: "Type de document requis" }, { status: 400 });
  }

  await ensureKeysForAllAuthorities();

  // La demande est créée en attente de paiement.
  // Le pipeline ne démarre qu'après confirmation du paiement.
  const request = await prisma.request.create({
    data: {
      type,
      reason: reason || null,
      userId,
      status: "AWAITING_PAYMENT",
      pipelineStep: "AWAITING_PAYMENT",
    },
  });

  await logAudit({
    actorId: userId,
    actorType: "CITIZEN",
    action: AuditAction.REQUEST_CREATED,
    resourceType: "Request",
    resourceId: request.id,
    metadata: { type, amount: totalPrice(type) },
    ip: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json(
    {
      ...request,
      amountDue: totalPrice(type),
      currency: "XOF",
    },
    { status: 201 },
  );
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const requests = await prisma.request.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { document: true, payment: true },
  });

  return NextResponse.json(requests);
}
