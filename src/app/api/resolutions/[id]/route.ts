import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const r = await prisma.resolutionRequest.findUnique({
    where: { id },
    include: { request: true },
  });
  if (!r) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (r.userId !== userId) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  return NextResponse.json(r);
}
