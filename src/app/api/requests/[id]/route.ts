import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;

  const { id } = await params;
  const request = await prisma.request.findUnique({
    where: { id },
    include: { document: true },
  });
  if (!request) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }
  if (request.userId !== userId && role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  return NextResponse.json(request);
}
