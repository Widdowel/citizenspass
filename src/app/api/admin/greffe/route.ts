import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!session?.user || (user?.role !== "ADMIN" && user?.role !== "ADMIN_GREFFE")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const items = await prisma.resolutionRequest.findMany({
    where: { type: "JUDICIAL_REVIEW", status: { in: ["PENDING_REVIEW"] } },
    include: {
      request: { include: { user: { include: { registry: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const recent = await prisma.resolutionRequest.findMany({
    where: { type: "JUDICIAL_REVIEW", status: { in: ["APPROVED", "REJECTED"] } },
    include: { request: { include: { user: true } } },
    orderBy: { reviewedAt: "desc" },
    take: 10,
  });

  return NextResponse.json({ pending: items, recent });
}
