import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { prisma } from "./prisma";
import { lookupByUserId, checkEligibility, extractDataForDocument } from "./registry";
import { signPayload, buildPayload } from "./signature";
import { generateOfficialPdf } from "./pdf-generator";
import { logAudit, AuditAction } from "./audit";
import {
  DOC_TYPES,
  DOC_AUTHORITY,
  DOC_VALIDITY_MONTHS,
  DOC_SERIAL_PREFIX,
  AUTHORITIES,
} from "./constants";

const DOCS_DIR = path.join(process.cwd(), "data", "documents");

async function ensureDocsDir() {
  await fs.mkdir(DOCS_DIR, { recursive: true });
}

export async function getDocumentPdfPath(documentId: string): Promise<string> {
  return path.join(DOCS_DIR, `${documentId}.pdf`);
}

function generateSerial(type: string, count: number): string {
  const prefix = DOC_SERIAL_PREFIX[type] ?? "DOC";
  const year = new Date().getFullYear();
  const seq = String(count).padStart(6, "0");
  return `BEN-${prefix}-${year}-${seq}`;
}

function generateQrCode(): string {
  const part = () => randomBytes(2).toString("hex").toUpperCase();
  return `DOC-${part()}-${part()}-${part()}-${part()}`;
}

function computeValidUntil(type: string, issuedAt: Date): Date | null {
  const months = DOC_VALIDITY_MONTHS[type] ?? 0;
  if (months === 0) return null;
  const d = new Date(issuedAt);
  d.setMonth(d.getMonth() + months);
  return d;
}

const STEP_DELAY_MS = 700;

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function setStep(requestId: string, step: string, status: string) {
  await prisma.request.update({
    where: { id: requestId },
    data: { status, pipelineStep: step },
  });
  await logAudit({
    actorType: "SYSTEM",
    action: AuditAction.REQUEST_PIPELINE_STEP,
    resourceType: "Request",
    resourceId: requestId,
    metadata: { step },
  });
}

export async function runPipeline(requestId: string, baseUrl: string) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { user: true },
  });
  if (!request) return;

  await prisma.request.update({
    where: { id: requestId },
    data: { processingStartedAt: new Date(), autoProcessed: true },
  });

  try {
    // 1. VERIFYING — registry lookup
    await setStep(requestId, "VERIFYING", "VERIFYING");
    await delay(STEP_DELAY_MS);
    const citizen = await lookupByUserId(request.userId);
    await logAudit({
      actorId: request.userId,
      actorType: "SYSTEM",
      action: AuditAction.REGISTRY_LOOKUP,
      resourceType: "CitizenRegistry",
      resourceId: citizen?.id,
      metadata: { found: !!citizen, requestId },
    });
    if (!citizen) {
      await markException(
        requestId,
        "Citoyen introuvable au registre ANIP. Enrôlement biométrique requis.",
      );
      return;
    }

    // 2. CHECKING — eligibility against native sources
    await setStep(requestId, "CHECKING", "CHECKING");
    await delay(STEP_DELAY_MS);
    const eligibility = checkEligibility(citizen, request.type);
    await logAudit({
      actorId: request.userId,
      actorType: "SYSTEM",
      action: AuditAction.ELIGIBILITY_CHECK,
      resourceType: "Request",
      resourceId: requestId,
      metadata: eligibility as unknown as Record<string, unknown>,
    });
    if (!eligibility.eligible) {
      await markException(requestId, eligibility.exceptionReason ?? "Inéligible");
      return;
    }

    // 3. GENERATING — extract data + generate PDF
    await setStep(requestId, "GENERATING", "GENERATING");
    await delay(STEP_DELAY_MS);
    const data = extractDataForDocument(citizen, request.type);
    const authorityCode = DOC_AUTHORITY[request.type];
    const totalOfType = await prisma.document.count({ where: { type: request.type } });
    const serialNumber = generateSerial(request.type, totalOfType + 1);
    const qrCode = generateQrCode();
    const issuedAt = new Date();
    const validUntil = computeValidUntil(request.type, issuedAt);
    const verifyUrl = `${baseUrl}/verify?code=${qrCode}`;

    // 4. SIGNING — cryptographic signature
    await setStep(requestId, "SIGNING", "SIGNING");
    await delay(STEP_DELAY_MS);

    const payloadObj = {
      serialNumber,
      qrCode,
      type: request.type,
      title: DOC_TYPES[request.type],
      issuedAt: issuedAt.toISOString(),
      validUntil: validUntil?.toISOString() ?? null,
      authorityCode,
      authority: AUTHORITIES[authorityCode].name,
      citizen: {
        cip: data.cip,
        fullName: data.fullName,
        birthDate: data.birthDate,
        birthPlace: data.birthPlace,
      },
      data,
    };
    const payload = buildPayload(payloadObj);
    const signatureBundle = await signPayload(authorityCode, payload);

    await logAudit({
      actorId: request.userId,
      actorType: "SYSTEM",
      action: AuditAction.DOCUMENT_SIGNED,
      resourceType: "Document",
      metadata: { keyId: signatureBundle.keyId, hash: signatureBundle.payloadHash },
    });

    // Generate PDF
    const pdfBytes = await generateOfficialPdf({
      type: request.type,
      serialNumber,
      qrCode,
      data,
      authorityCode,
      signature: signatureBundle,
      issuedAt: issuedAt.toISOString(),
      validUntil: validUntil?.toISOString() ?? null,
      verifyUrl,
    });

    // Persist Document
    const doc = await prisma.document.create({
      data: {
        serialNumber,
        type: request.type,
        title: DOC_TYPES[request.type] ?? request.type,
        qrCode,
        payloadHash: signatureBundle.payloadHash,
        signature: signatureBundle.signature,
        signatureAlgo: signatureBundle.signatureAlgo,
        keyId: signatureBundle.keyId,
        issuingAuthority: signatureBundle.authority,
        authorityCode,
        issuedAt,
        validUntil,
        userId: request.userId,
        requestId: request.id,
        metadata: JSON.stringify(payloadObj),
      },
    });

    await ensureDocsDir();
    await fs.writeFile(await getDocumentPdfPath(doc.id), pdfBytes);
    await prisma.document.update({
      where: { id: doc.id },
      data: { fileUrl: `/api/documents/${doc.id}/file` },
    });

    await logAudit({
      actorId: request.userId,
      actorType: "SYSTEM",
      action: AuditAction.DOCUMENT_GENERATED,
      resourceType: "Document",
      resourceId: doc.id,
      metadata: { serialNumber, type: request.type },
    });

    // 5. READY
    await prisma.request.update({
      where: { id: requestId },
      data: {
        status: "READY",
        pipelineStep: "READY",
        processingEndedAt: new Date(),
      },
    });

    await logAudit({
      actorId: request.userId,
      actorType: "SYSTEM",
      action: AuditAction.DOCUMENT_DELIVERED,
      resourceType: "Document",
      resourceId: doc.id,
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Erreur inconnue";
    await markException(requestId, `Erreur technique : ${reason}`);
  }
}

async function markException(requestId: string, reason: string) {
  await prisma.request.update({
    where: { id: requestId },
    data: {
      status: "EXCEPTION",
      pipelineStep: "EXCEPTION",
      exceptionReason: reason,
      processingEndedAt: new Date(),
    },
  });
  await logAudit({
    actorType: "SYSTEM",
    action: AuditAction.REQUEST_EXCEPTION,
    resourceType: "Request",
    resourceId: requestId,
    metadata: { reason },
  });
}
