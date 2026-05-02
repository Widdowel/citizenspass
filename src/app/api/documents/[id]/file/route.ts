import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  if (!doc.pdfBytes) {
    return NextResponse.json({ error: "Fichier indisponible" }, { status: 404 });
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

  return new NextResponse(new Uint8Array(doc.pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.serialNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
