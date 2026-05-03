import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { ATTRIBUTE_LABELS } from "@/lib/attributes";

function hashApiKey(k: string): string {
  return createHash("sha256").update(k).digest("hex");
}

// Le tiers (banque) poll cet endpoint pour récupérer le résultat
// dès que le citoyen a autorisé / refusé.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "X-API-Key requis" }, { status: 401 });
  }

  const verifier = await prisma.verifierApp.findUnique({
    where: { apiKeyHash: hashApiKey(apiKey) },
  });
  if (!verifier) {
    return NextResponse.json({ error: "Clé API invalide" }, { status: 403 });
  }

  const { id } = await params;
  const verif = await prisma.verificationRequest.findUnique({
    where: { id },
    include: { verifier: true },
  });
  if (!verif || verif.verifierId !== verifier.id) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }

  // Auto-expire si dépassé
  if (verif.status === "PENDING" && verif.expiresAt < new Date()) {
    await prisma.verificationRequest.update({
      where: { id },
      data: { status: "EXPIRED" },
    });
    verif.status = "EXPIRED";
  }

  const askedKeys = JSON.parse(verif.attributesAsked) as string[];
  const askedDetails = askedKeys.map((k) => ({
    key: k,
    label: ATTRIBUTE_LABELS[k as keyof typeof ATTRIBUTE_LABELS]?.label ?? k,
  }));

  if (verif.status === "AUTHORIZED") {
    return NextResponse.json({
      status: "AUTHORIZED",
      verificationId: verif.id,
      authorizedAt: verif.authorizedAt,
      attributes: verif.responseAttrs ? JSON.parse(verif.responseAttrs) : null,
      signature: {
        algorithm: "RSA-SHA256",
        keyId: verif.responseKeyId,
        payloadHash: verif.responseHash,
        signature: verif.responseSignature,
      },
      verifier: verif.verifier.name,
      askedDetails,
    });
  }

  return NextResponse.json({
    status: verif.status,
    verificationId: verif.id,
    expiresAt: verif.expiresAt,
    askedDetails,
  });
}
