import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DOC_TYPES } from "@/lib/constants";
import { verifySignature, publicKeyFingerprint } from "@/lib/signature";
import { logAudit, AuditAction } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ valid: false, reason: "Code manquant" });
  }

  const document = await prisma.document.findUnique({
    where: { qrCode: code },
    include: { user: { select: { name: true, cip: true } } },
  });

  if (!document) {
    await logAudit({
      actorType: "EXTERNAL_VERIFIER",
      action: AuditAction.DOCUMENT_VERIFIED,
      resourceType: "Document",
      ip: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
      metadata: { code, found: false },
    });
    return NextResponse.json({
      valid: false,
      reason: "Aucun document ne correspond à ce code dans le registre national.",
    });
  }

  // Replay the original payload from stored metadata
  const meta = document.metadata ? JSON.parse(document.metadata) : null;
  const sortedKeys = meta ? Object.keys(meta).sort() : [];
  const sortedPayload = sortedKeys.reduce<Record<string, unknown>>((acc, k) => {
    acc[k] = meta[k];
    return acc;
  }, {});
  const payload = JSON.stringify(sortedPayload);

  const verification = await verifySignature(payload, document.signature, document.keyId);
  const isRevoked = !!document.revokedAt;
  const isExpired =
    document.validUntil ? new Date(document.validUntil) < new Date() : false;

  const overallValid = verification.valid && !isRevoked && !isExpired;

  await logAudit({
    actorType: "EXTERNAL_VERIFIER",
    action: AuditAction.DOCUMENT_VERIFIED,
    resourceType: "Document",
    resourceId: document.id,
    ip: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
    metadata: {
      signatureValid: verification.valid,
      revoked: isRevoked,
      expired: isExpired,
    },
  });

  return NextResponse.json({
    valid: overallValid,
    reasons: {
      signatureValid: verification.valid,
      revoked: isRevoked,
      expired: isExpired,
    },
    document: {
      serialNumber: document.serialNumber,
      title: document.title,
      type: DOC_TYPES[document.type] || document.type,
      typeCode: document.type,
      issuedAt: document.issuedAt.toISOString(),
      validUntil: document.validUntil?.toISOString() ?? null,
      revokedAt: document.revokedAt?.toISOString() ?? null,
      issuingAuthority: document.issuingAuthority,
      authorityCode: document.authorityCode,
      holderName: document.user.name,
      holderCipMasked:
        document.user.cip.slice(0, 4) + "••••••" + document.user.cip.slice(-2),
    },
    signature: {
      algorithm: document.signatureAlgo,
      keyId: document.keyId,
      keyFingerprint: verification.publicKey
        ? publicKeyFingerprint(verification.publicKey)
        : null,
      payloadHash: document.payloadHash,
      signatureExcerpt:
        document.signature.slice(0, 32) + "…" + document.signature.slice(-16),
    },
  });
}
