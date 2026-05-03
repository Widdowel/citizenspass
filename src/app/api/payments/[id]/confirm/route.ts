import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runPipeline } from "@/lib/document-pipeline";
import { logAudit } from "@/lib/audit";

// Pipeline = ~3-5s, autorise jusqu'à 60s pour avoir de la marge
export const maxDuration = 60;

// Simulation du callback opérateur (Kkiapay/FedaPay) qui confirme le paiement.
// En production: cet endpoint serait un webhook signé par l'opérateur.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { request: true },
  });
  if (!payment || payment.userId !== userId) {
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
  }
  if (payment.status === "COMPLETED") {
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }

  const updated = await prisma.payment.update({
    where: { id },
    data: { status: "COMPLETED", paidAt: new Date() },
  });

  await prisma.request.update({
    where: { id: payment.requestId },
    data: { status: "PENDING", pipelineStep: "PENDING" },
  });

  await logAudit({
    actorId: userId,
    actorType: "CITIZEN",
    action: "PAYMENT_CONFIRMED",
    resourceType: "Payment",
    resourceId: payment.id,
    metadata: {
      method: payment.method,
      amount: payment.amount,
      transactionRef: payment.transactionRef,
    },
  });

  // Lance le pipeline en arrière-plan via `after` — la réponse est renvoyée
  // immédiatement au client, et la fonction serverless reste vivante le temps
  // que le pipeline termine (jusqu'à maxDuration secondes).
  const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const requestId = payment.requestId;
  after(async () => {
    await runPipeline(requestId, baseUrl);
  });

  return NextResponse.json({ ok: true, payment: updated });
}
