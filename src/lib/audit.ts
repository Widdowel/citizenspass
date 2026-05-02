import { createHash } from "crypto";
import { prisma } from "./prisma";

export type AuditEntry = {
  actorId?: string | null;
  actorType: "CITIZEN" | "ADMIN" | "SYSTEM" | "EXTERNAL_VERIFIER";
  action: string;
  resourceType?: string;
  resourceId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

function entryHash(entry: AuditEntry, prevHash: string | null, createdAt: Date) {
  const repr = JSON.stringify({
    ...entry,
    metadata: entry.metadata ?? null,
    prevHash,
    createdAt: createdAt.toISOString(),
  });
  return createHash("sha256").update(repr).digest("hex");
}

export async function logAudit(entry: AuditEntry) {
  const last = await prisma.auditLog.findFirst({
    orderBy: { createdAt: "desc" },
  });
  const prevHash = last?.hash ?? null;
  const createdAt = new Date();
  const hash = entryHash(entry, prevHash, createdAt);

  return prisma.auditLog.create({
    data: {
      actorId: entry.actorId ?? null,
      actorType: entry.actorType,
      action: entry.action,
      resourceType: entry.resourceType ?? null,
      resourceId: entry.resourceId ?? null,
      ip: entry.ip ?? null,
      userAgent: entry.userAgent ?? null,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      prevHash,
      hash,
      createdAt,
    },
  });
}

export const AuditAction = {
  AUTH_LOGIN: "AUTH_LOGIN",
  REGISTRY_LOOKUP: "REGISTRY_LOOKUP",
  ELIGIBILITY_CHECK: "ELIGIBILITY_CHECK",
  REQUEST_CREATED: "REQUEST_CREATED",
  REQUEST_PIPELINE_STEP: "REQUEST_PIPELINE_STEP",
  DOCUMENT_GENERATED: "DOCUMENT_GENERATED",
  DOCUMENT_SIGNED: "DOCUMENT_SIGNED",
  DOCUMENT_DELIVERED: "DOCUMENT_DELIVERED",
  DOCUMENT_DOWNLOADED: "DOCUMENT_DOWNLOADED",
  DOCUMENT_VERIFIED: "DOCUMENT_VERIFIED",
  REQUEST_EXCEPTION: "REQUEST_EXCEPTION",
  ADMIN_OVERRIDE: "ADMIN_OVERRIDE",
} as const;
