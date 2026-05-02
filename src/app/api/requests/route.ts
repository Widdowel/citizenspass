import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runPipeline } from "@/lib/document-pipeline";
import { logAudit, AuditAction } from "@/lib/audit";
import { ensureKeysForAllAuthorities } from "@/lib/signature";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { type, reason } = await req.json();

  if (!type) {
    return NextResponse.json({ error: "Type de document requis" }, { status: 400 });
  }

  await ensureKeysForAllAuthorities();

  const request = await prisma.request.create({
    data: { type, reason: reason || null, userId, status: "PENDING", pipelineStep: "PENDING" },
  });

  await logAudit({
    actorId: userId,
    actorType: "CITIZEN",
    action: AuditAction.REQUEST_CREATED,
    resourceType: "Request",
    resourceId: request.id,
    metadata: { type },
    ip: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  // Lance le pipeline en tâche de fond — ne bloque pas la réponse
  void runPipeline(request.id, baseUrl);

  return NextResponse.json(request, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const requests = await prisma.request.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { document: true },
  });

  return NextResponse.json(requests);
}
