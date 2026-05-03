import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runPipeline } from "@/lib/document-pipeline";
import { logAudit } from "@/lib/audit";

export const maxDuration = 60;

// L'agent administratif valide la numérisation : il complète le registre
// avec les données extraites du registre papier physique.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const adminUser = session?.user as { id?: string; role?: string } | undefined;

  if (!session?.user || adminUser?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const request = await prisma.request.findUnique({
    where: { id },
    include: { user: { include: { registry: true } } },
  });
  if (!request) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }
  if (!request.user.registry) {
    return NextResponse.json({ error: "Registre introuvable" }, { status: 404 });
  }
  if (request.status !== "EXTRACTION_REQUIRED") {
    return NextResponse.json(
      { error: "Cette demande ne nécessite pas d'extraction" },
      { status: 400 },
    );
  }

  // Données extraites du registre papier (saisies par l'agent)
  const updates: Record<string, unknown> = {
    sourceType: "PAPER_DIGITIZED",
    digitizedAt: new Date(),
    digitizedById: adminUser?.id ?? null,
    paperReference: body.paperReference ?? null,
  };

  // Ne mettre à jour que les champs effectivement saisis
  const editableFields = [
    "firstName",
    "lastName",
    "middleName",
    "birthDate",
    "birthPlace",
    "birthCommune",
    "birthDepartment",
    "fatherName",
    "motherName",
    "address",
    "commune",
    "department",
  ];
  for (const f of editableFields) {
    if (body[f] !== undefined && body[f] !== "") {
      updates[f] = f === "birthDate" ? new Date(body[f] as string) : body[f];
    }
  }

  await prisma.citizenRegistry.update({
    where: { id: request.user.registry.id },
    data: updates,
  });

  await logAudit({
    actorId: adminUser?.id,
    actorType: "ADMIN",
    action: "REGISTRY_DIGITIZED",
    resourceType: "CitizenRegistry",
    resourceId: request.user.registry.id,
    metadata: { paperRef: body.paperReference, updatedFields: Object.keys(updates) },
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });

  // Relance le pipeline maintenant que le registre est complet
  await prisma.request.update({
    where: { id },
    data: { status: "PENDING", pipelineStep: "PENDING", exceptionReason: null },
  });

  const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  after(async () => {
    await runPipeline(id, baseUrl);
  });

  return NextResponse.json({ ok: true });
}
