import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDocumentPdfPath } from "@/lib/document-pipeline";
import { logAudit, AuditAction } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;

  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (doc.userId !== userId && role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const pdfPath = await getDocumentPdfPath(id);
  let pdf: Buffer;
  try {
    pdf = await fs.readFile(pdfPath);
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  await logAudit({
    actorId: userId,
    actorType: role === "ADMIN" ? "ADMIN" : "CITIZEN",
    action: AuditAction.DOCUMENT_DOWNLOADED,
    resourceType: "Document",
    resourceId: id,
    ip: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.serialNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
