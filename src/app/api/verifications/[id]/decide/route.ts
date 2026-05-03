import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveAttributes, type AttributeKey } from "@/lib/attributes";
import { signPayload, buildPayload } from "@/lib/signature";
import { logAudit } from "@/lib/audit";

// Le citoyen autorise (ou refuse) une demande de vérification.
// Si autorisée : calcul des attributs + signature cryptographique.
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

  const { decision, parameters } = (await req.json()) as {
    decision: "AUTHORIZE" | "DENY";
    parameters?: Record<string, string>;
  };

  if (decision !== "AUTHORIZE" && decision !== "DENY") {
    return NextResponse.json({ error: "decision invalide" }, { status: 400 });
  }

  const verif = await prisma.verificationRequest.findUnique({
    where: { id },
    include: { verifier: true, citizen: { include: { registry: true } } },
  });
  if (!verif) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }
  if (verif.citizenId !== userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  if (verif.status !== "PENDING") {
    return NextResponse.json(
      { error: `Demande déjà ${verif.status.toLowerCase()}` },
      { status: 409 },
    );
  }
  if (verif.expiresAt < new Date()) {
    await prisma.verificationRequest.update({
      where: { id },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ error: "Demande expirée" }, { status: 410 });
  }

  if (decision === "DENY") {
    await prisma.verificationRequest.update({
      where: { id },
      data: { status: "DENIED", deniedAt: new Date() },
    });
    await logAudit({
      actorId: userId,
      actorType: "CITIZEN",
      action: "VERIFICATION_DENIED",
      resourceType: "VerificationRequest",
      resourceId: id,
      metadata: { verifier: verif.verifier.name },
    });
    return NextResponse.json({ ok: true, decision: "DENIED" });
  }

  // AUTHORIZE — calcule les attributs + signe
  if (!verif.citizen?.registry) {
    return NextResponse.json(
      { error: "Citoyen sans registre — impossible de calculer les attributs" },
      { status: 400 },
    );
  }

  const askedKeys = JSON.parse(verif.attributesAsked) as AttributeKey[];
  const resolved = resolveAttributes(verif.citizen.registry, askedKeys, parameters);

  const responseObj = {
    verificationId: id,
    citizenCip: verif.citizenCip,
    verifier: verif.verifier.name,
    issuedAt: new Date().toISOString(),
    attributes: resolved.reduce<Record<string, unknown>>((acc, r) => {
      if (r.available) acc[r.key] = r.value;
      else acc[r.key] = { unavailable: true, reason: r.reason };
      return acc;
    }, {}),
  };

  const payload = buildPayload(responseObj);
  // Signe avec la clé COUR_APPEL_COTONOU (autorité de référence pour la vérification d'identité)
  const sig = await signPayload("COUR_APPEL_COTONOU", payload);

  await prisma.verificationRequest.update({
    where: { id },
    data: {
      status: "AUTHORIZED",
      authorizedAt: new Date(),
      responseAttrs: JSON.stringify(responseObj),
      responseSignature: sig.signature,
      responseKeyId: sig.keyId,
      responseHash: sig.payloadHash,
    },
  });

  await logAudit({
    actorId: userId,
    actorType: "CITIZEN",
    action: "VERIFICATION_AUTHORIZED",
    resourceType: "VerificationRequest",
    resourceId: id,
    metadata: {
      verifier: verif.verifier.name,
      attributes: askedKeys,
    },
  });

  return NextResponse.json({ ok: true, decision: "AUTHORIZED" });
}
