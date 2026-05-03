import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { autoApproveFiscalResolution } from "@/lib/resolution";
import { runPipeline } from "@/lib/document-pipeline";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/constants";

export const maxDuration = 60;

// Le citoyen paie une régularisation (FISCAL ou JUDICIAL frais de revue).
// Pour FISCAL : auto-approve + relance pipeline immédiatement → quitus généré.
// Pour JUDICIAL : passage en file greffe (statut PENDING_REVIEW).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const { method, phoneNumber, citizenComment } = (await req.json()) as {
    method: PaymentMethod;
    phoneNumber?: string;
    citizenComment?: string;
  };

  if (!method || !PAYMENT_METHODS[method]) {
    return NextResponse.json({ error: "Méthode invalide" }, { status: 400 });
  }

  const r = await prisma.resolutionRequest.findUnique({
    where: { id },
    include: { request: true },
  });
  if (!r) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (r.userId !== userId) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  if (r.status !== "PENDING_PAYMENT") {
    return NextResponse.json({ error: "Déjà traitée" }, { status: 409 });
  }

  // Crée le Payment lié à la Request originale (réutilise le modèle)
  const transactionRef = `BEN-RES-${Date.now().toString(36).toUpperCase()}`;
  const payment = await prisma.payment.upsert({
    where: { requestId: r.requestId },
    create: {
      requestId: r.requestId,
      userId,
      amount: r.amount,
      method,
      phoneNumber: phoneNumber ?? null,
      transactionRef,
      status: "COMPLETED",
      paidAt: new Date(),
    },
    update: {
      method,
      phoneNumber: phoneNumber ?? null,
      transactionRef,
      status: "COMPLETED",
      paidAt: new Date(),
    },
  });

  await prisma.resolutionRequest.update({
    where: { id },
    data: { paymentId: payment.id },
  });

  await logAudit({
    actorId: userId,
    actorType: "CITIZEN",
    action: "RESOLUTION_PAID",
    resourceType: "ResolutionRequest",
    resourceId: id,
    metadata: { type: r.type, amount: r.amount, method },
  });

  // FISCAL : auto-approve + relance pipeline original (aucune intervention humaine)
  if (r.type === "FISCAL_DEBT") {
    await autoApproveFiscalResolution(id);
    const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    after(async () => {
      // Reset le status pour que le pipeline reparte de zéro
      await prisma.request.update({
        where: { id: r.requestId },
        data: {
          status: "PENDING",
          pipelineStep: "PENDING",
          exceptionReason: null,
        },
      });
      await runPipeline(r.requestId, baseUrl);
    });
    return NextResponse.json({ ok: true, autoApproved: true });
  }

  // JUDICIAL : on attend la décision du greffier
  if (r.type === "JUDICIAL_REVIEW") {
    await prisma.resolutionRequest.update({
      where: { id },
      data: {
        status: "PENDING_REVIEW",
        citizenComment: citizenComment ?? null,
      },
    });
    return NextResponse.json({ ok: true, queuedForReview: true });
  }

  return NextResponse.json({ ok: true });
}
