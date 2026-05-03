import { prisma } from "./prisma";
import { logAudit } from "./audit";

export const RESOLUTION_PRICING = {
  FISCAL_DEBT_DEMO: 25000,
  FISCAL_SERVICE_FEE: 500,
  JUDICIAL_REVIEW_FEE: 5000,
};

export type ResolutionType = "FISCAL_DEBT" | "JUDICIAL_REVIEW";

export async function createResolutionRequest(
  requestId: string,
  userId: string,
  type: ResolutionType,
): Promise<void> {
  const existing = await prisma.resolutionRequest.findUnique({ where: { requestId } });
  if (existing) return;

  let amount: number;
  let description: string;

  if (type === "FISCAL_DEBT") {
    amount = RESOLUTION_PRICING.FISCAL_DEBT_DEMO + RESOLUTION_PRICING.FISCAL_SERVICE_FEE;
    description = `Vous avez ${RESOLUTION_PRICING.FISCAL_DEBT_DEMO.toLocaleString("fr-FR")} FCFA d'impôts dûs (régularisation au 31/12). Payez immédiatement via BJ Pay ou Mobile Money — votre quitus sera généré automatiquement après confirmation du paiement, sans intervention humaine.`;
  } else {
    amount = RESOLUTION_PRICING.JUDICIAL_REVIEW_FEE;
    description = `Une procédure judiciaire est inscrite à votre nom. Demandez une revue par le greffe : payez les frais (${amount.toLocaleString("fr-FR")} FCFA) et ajoutez un commentaire justificatif. Le greffier validera ou non sous quelques heures, sans déplacement.`;
  }

  await prisma.resolutionRequest.create({
    data: { requestId, userId, type, amount, description, status: "PENDING_PAYMENT" },
  });

  await logAudit({
    actorType: "SYSTEM",
    action: "RESOLUTION_CREATED",
    resourceType: "ResolutionRequest",
    metadata: { type, amount, requestId },
  });
}

// FISCAL : paiement = régularisation auto
export async function autoApproveFiscalResolution(resolutionId: string): Promise<void> {
  const r = await prisma.resolutionRequest.findUnique({
    where: { id: resolutionId },
    include: { request: { include: { user: { include: { registry: true } } } } },
  });
  if (!r || r.type !== "FISCAL_DEBT") return;
  if (r.status !== "PENDING_PAYMENT") return;
  if (!r.request.user.registry) return;

  await prisma.citizenRegistry.update({
    where: { id: r.request.user.registry.id },
    data: { fiscalStatus: "UP_TO_DATE" },
  });

  await prisma.resolutionRequest.update({
    where: { id: resolutionId },
    data: { status: "RESOLVED_AUTO", resolvedAt: new Date() },
  });

  await logAudit({
    actorId: r.userId,
    actorType: "SYSTEM",
    action: "RESOLUTION_AUTO_APPROVED",
    resourceType: "ResolutionRequest",
    resourceId: resolutionId,
    metadata: { type: "FISCAL_DEBT" },
  });
}

// JUDICIAL : passe en file greffe
export async function submitJudicialReview(
  resolutionId: string,
  citizenComment: string,
): Promise<void> {
  await prisma.resolutionRequest.update({
    where: { id: resolutionId },
    data: { status: "PENDING_REVIEW", citizenComment },
  });
  await logAudit({
    actorType: "SYSTEM",
    action: "RESOLUTION_SUBMITTED_FOR_REVIEW",
    resourceType: "ResolutionRequest",
    resourceId: resolutionId,
  });
}

export async function decideJudicialReview(
  resolutionId: string,
  reviewerId: string,
  decision: "APPROVED" | "REJECTED",
  reviewerNote: string,
): Promise<{ requestId: string }> {
  const r = await prisma.resolutionRequest.findUnique({
    where: { id: resolutionId },
    include: { request: { include: { user: { include: { registry: true } } } } },
  });
  if (!r || r.type !== "JUDICIAL_REVIEW") throw new Error("Résolution introuvable ou type incorrect");
  if (r.status !== "PENDING_REVIEW") throw new Error("Résolution déjà traitée");

  if (decision === "APPROVED" && r.request.user.registry) {
    await prisma.citizenRegistry.update({
      where: { id: r.request.user.registry.id },
      data: { judicialStatus: "CLEAN", judicialDetails: null },
    });
  }

  await prisma.resolutionRequest.update({
    where: { id: resolutionId },
    data: {
      status: decision,
      reviewedById: reviewerId,
      reviewerNote,
      reviewedAt: new Date(),
      resolvedAt: decision === "APPROVED" ? new Date() : null,
    },
  });

  await logAudit({
    actorId: reviewerId,
    actorType: "ADMIN",
    action: "RESOLUTION_REVIEWED",
    resourceType: "ResolutionRequest",
    resourceId: resolutionId,
    metadata: { decision, type: "JUDICIAL_REVIEW" },
  });

  return { requestId: r.requestId };
}
