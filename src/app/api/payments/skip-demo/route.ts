import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runPipeline } from "@/lib/document-pipeline";
import { logAudit } from "@/lib/audit";
import { totalPrice } from "@/lib/constants";

// Endpoint démo : crée le Payment et le marque immédiatement comme COMPLETED.
// Utilisé pour accélérer les démos. Désactivé en production avec
// DISABLE_DEMO_SKIP=1.
export async function POST(req: NextRequest) {
  if (process.env.DISABLE_DEMO_SKIP === "1") {
    return NextResponse.json({ error: "Mode démo désactivé" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const { requestId } = (await req.json()) as { requestId: string };
  if (!requestId) {
    return NextResponse.json({ error: "requestId requis" }, { status: 400 });
  }

  const r = await prisma.request.findUnique({
    where: { id: requestId },
    include: { payment: true },
  });
  if (!r || r.userId !== userId) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }

  const amount = totalPrice(r.type);
  const transactionRef = `BEN-DEMO-${Date.now().toString(36).toUpperCase()}`;

  const payment = await prisma.payment.upsert({
    where: { requestId },
    create: {
      requestId,
      userId,
      amount,
      method: "BJ_PAY",
      transactionRef,
      status: "COMPLETED",
      paidAt: new Date(),
    },
    update: {
      method: "BJ_PAY",
      transactionRef,
      status: "COMPLETED",
      paidAt: new Date(),
    },
  });

  await prisma.request.update({
    where: { id: requestId },
    data: { status: "PENDING", pipelineStep: "PENDING" },
  });

  await logAudit({
    actorId: userId,
    actorType: "CITIZEN",
    action: "PAYMENT_SKIPPED_DEMO",
    resourceType: "Payment",
    resourceId: payment.id,
    metadata: { requestId, amount },
  });

  const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  void runPipeline(requestId, baseUrl);

  return NextResponse.json({ ok: true, paymentId: payment.id });
}
