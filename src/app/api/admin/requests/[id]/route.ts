import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runPipeline } from "@/lib/document-pipeline";
import { logAudit, AuditAction } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!session?.user || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const { status, note } = await req.json();

  await prisma.request.update({
    where: { id },
    data: { status, note: note || null },
  });

  await logAudit({
    actorId: user?.id,
    actorType: "ADMIN",
    action: AuditAction.ADMIN_OVERRIDE,
    resourceType: "Request",
    resourceId: id,
    metadata: { status, note },
    ip: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  // Si l'admin approuve une exception, on relance le pipeline en mode forcé
  if (status === "APPROVED") {
    const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    void runPipeline(id, baseUrl);
  }

  return NextResponse.json({ ok: true });
}
