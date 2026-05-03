import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ATTRIBUTE_LABELS, type AttributeKey } from "@/lib/attributes";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const verif = await prisma.verificationRequest.findUnique({
    where: { id },
    include: { verifier: true },
  });
  if (!verif) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  if (verif.citizenId !== userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const askedKeys = JSON.parse(verif.attributesAsked) as AttributeKey[];
  return NextResponse.json({
    verificationId: verif.id,
    status: verif.status,
    verifier: { name: verif.verifier.name, category: verif.verifier.category },
    purpose: verif.purpose,
    attributesAsked: askedKeys.map((k) => ({
      key: k,
      label: ATTRIBUTE_LABELS[k]?.label ?? k,
      sensitivity: ATTRIBUTE_LABELS[k]?.sensitivity ?? "low",
    })),
    expiresAt: verif.expiresAt,
    createdAt: verif.createdAt,
  });
}
