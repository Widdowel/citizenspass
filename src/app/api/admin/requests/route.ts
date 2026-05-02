import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!session?.user || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const requests = await prisma.request.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, cip: true } } },
  });

  return NextResponse.json(requests);
}
