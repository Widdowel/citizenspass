import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DOC_TYPES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ valid: false });
  }

  const document = await prisma.document.findUnique({
    where: { qrCode: code },
    include: { user: { select: { name: true } } },
  });

  if (!document) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({
    valid: true,
    document: {
      title: document.title,
      type: DOC_TYPES[document.type] || document.type,
      issuedAt: document.issuedAt.toISOString(),
      userName: document.user.name,
    },
  });
}
