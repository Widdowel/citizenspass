import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { totalPrice, PAYMENT_METHODS, type PaymentMethod } from "@/lib/constants";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const { requestId, method, phoneNumber } = (await req.json()) as {
    requestId: string;
    method: PaymentMethod;
    phoneNumber?: string;
  };

  if (!requestId || !method || !PAYMENT_METHODS[method]) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const r = await prisma.request.findUnique({
    where: { id: requestId },
    include: { payment: true },
  });
  if (!r || r.userId !== userId) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }
  if (r.payment?.status === "COMPLETED") {
    return NextResponse.json({ error: "Déjà payé" }, { status: 409 });
  }

  const amount = totalPrice(r.type);
  const transactionRef = `BEN-PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const payment = await prisma.payment.upsert({
    where: { requestId },
    create: {
      requestId,
      userId,
      amount,
      method,
      phoneNumber: phoneNumber ?? null,
      transactionRef,
      status: "PENDING",
    },
    update: {
      method,
      phoneNumber: phoneNumber ?? null,
      transactionRef,
      status: "PENDING",
    },
  });

  await logAudit({
    actorId: userId,
    actorType: "CITIZEN",
    action: "PAYMENT_INITIATED",
    resourceType: "Payment",
    resourceId: payment.id,
    metadata: { method, amount },
  });

  return NextResponse.json({
    paymentId: payment.id,
    transactionRef,
    amount,
    currency: "XOF",
    method,
  });
}
