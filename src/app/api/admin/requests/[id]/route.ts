import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DOC_TYPES } from "@/lib/constants";
import { randomUUID } from "crypto";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!session?.user || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorise" }, { status: 403 });
  }

  const { id } = await params;
  const { status, note } = await req.json();

  const request = await prisma.request.update({
    where: { id },
    data: { status, note: note || null },
  });

  // If approved, create the document automatically
  if (status === "APPROVED" || status === "READY") {
    const qrCode = `DOC-${randomUUID().slice(0, 4).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;

    await prisma.document.create({
      data: {
        type: request.type,
        title: DOC_TYPES[request.type] || request.type,
        qrCode,
        userId: request.userId,
      },
    });

    // Mark as READY
    await prisma.request.update({
      where: { id },
      data: { status: "READY" },
    });
  }

  return NextResponse.json(request);
}
