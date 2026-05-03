import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, AuditAction } from "@/lib/audit";

export const maxDuration = 60;

// L'admin de CitizenPass NE PEUT PAS débloquer les exceptions qui relèvent
// d'autorités tierces (DGI, greffe). Cette route est réduite à : ajouter une
// note d'audit pour traçabilité.
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
  const { note } = await req.json();

  await prisma.request.update({
    where: { id },
    data: { note: note || null },
  });

  await logAudit({
    actorId: user?.id,
    actorType: "ADMIN",
    action: AuditAction.ADMIN_OVERRIDE,
    resourceType: "Request",
    resourceId: id,
    metadata: { note, action: "annotate-only" },
    ip: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
