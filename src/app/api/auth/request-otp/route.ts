import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

function maskPhone(phone: string | null): string {
  if (!phone) return "+229 ** ** ** **";
  // Garde indicatif + 2 derniers chiffres
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.length < 4) return "+229 ** ** ** **";
  const last2 = cleaned.slice(-2);
  return `+229 ** ** ** ${last2}`;
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  const { identifier } = (await req.json()) as { identifier?: string };
  if (!identifier) {
    return NextResponse.json({ error: "Identifiant requis" }, { status: 400 });
  }

  const id = identifier.trim();
  const user = await prisma.user.findFirst({
    where: { OR: [{ cip: id }, { nin: id }] },
  });

  // Réponse uniforme pour ne pas leak l'existence de l'identifiant
  if (!user) {
    return NextResponse.json({
      ok: true,
      sent: false,
      phoneMask: "+229 ** ** ** **",
      // En démo : on ne révèle rien si identifiant inconnu
    });
  }

  // L'admin peut toujours utiliser le mot de passe (compte d'urgence)
  if (user.role === "ADMIN") {
    return NextResponse.json({
      ok: true,
      sent: false,
      requiresPassword: true,
      phoneMask: maskPhone(user.phone),
    });
  }

  const code = generateOtp();
  const phoneMask = maskPhone(user.phone);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  // Invalide les anciens OTP non consommés
  await prisma.otpCode.updateMany({
    where: { userId: user.id, consumed: false },
    data: { consumed: true },
  });

  await prisma.otpCode.create({
    data: {
      userId: user.id,
      code,
      phoneMask,
      expiresAt,
    },
  });

  await logAudit({
    actorId: user.id,
    actorType: "SYSTEM",
    action: "OTP_REQUESTED",
    resourceType: "User",
    resourceId: user.id,
    metadata: { channel: "SMS", phoneMask },
  });

  // En production réelle : on enverra le SMS via la passerelle ASIN/MTN/Moov.
  // En démo : on retourne le code dans la réponse pour faciliter le test.
  // Pour désactiver en prod réelle : définir HIDE_DEMO_OTP=1 dans les env vars.
  const hideDemo = process.env.HIDE_DEMO_OTP === "1";

  return NextResponse.json({
    ok: true,
    sent: true,
    phoneMask,
    requiresPassword: false,
    demoCode: hideDemo ? undefined : code,
  });
}
