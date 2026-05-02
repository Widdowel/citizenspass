import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { type, reason } = await req.json();

  if (!type) {
    return NextResponse.json({ error: "Type de document requis" }, { status: 400 });
  }

  const request = await prisma.request.create({
    data: { type, reason: reason || null, userId },
  });

  return NextResponse.json(request, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const requests = await prisma.request.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}
