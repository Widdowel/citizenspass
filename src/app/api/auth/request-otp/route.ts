import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import {
  checkRateLimit,
  recordRateLimit,
  isAccountLocked,
  clientIp,
  RATE_LIMITS,
} from "@/lib/security";

function maskPhone(phone: string | null): string {
  if (!phone) return "+229 ** ** ** **";
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.length < 4) return "+229 ** ** ** **";
  const last2 = cleaned.slice(-2);
  return `+229 ** ** ** ${last2}`;
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const { identifier } = (await req.json()) as { identifier?: string };
  if (!identifier) {
    return NextResponse.json({ error: "Identifiant requis" }, { status: 400 });
  }

  const id = identifier.trim();

  // Rate limit par IP (anti-spam)
  const rl = await checkRateLimit(RATE_LIMITS.OTP_REQUEST, ip);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: "Trop de demandes. Réessayez plus tard.",
        retryAfter: rl.resetAt.toISOString(),
      },
      { status: 429 },
    );
  }
  await recordRateLimit(RATE_LIMITS.OTP_REQUEST.scope, ip);

  const user = await prisma.user.findFirst({
    where: { OR: [{ cip: id }, { nin: id }] },
  });

  // Réponse uniforme pour ne pas leak l'existence de l'identifiant
  if (!user) {
    return NextResponse.json({
      ok: true,
      sent: false,
      phoneMask: "+229 ** ** ** **",
    });
  }

  // Account lock check
  const lockState = await isAccountLocked(user.id);
  if (lockState.locked) {
    return NextResponse.json(
      {
        error: "Compte temporairement verrouillé après plusieurs échecs.",
        unlockAt: lockState.until?.toISOString(),
      },
      { status: 423 },
    );
  }

  // Admin → mot de passe
  if (user.role === "ADMIN") {
    return NextResponse.json({
      ok: true,
      sent: false,
      requiresPassword: true,
      phoneMask: maskPhone(user.phone),
    });
  }

  const code = generateOtp();
  const codeHash = await hash(code, 10);
  const phoneMask = maskPhone(user.phone);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Invalide les anciens OTP non consommés
  await prisma.otpCode.updateMany({
    where: { userId: user.id, consumed: false },
    data: { consumed: true },
  });

  await prisma.otpCode.create({
    data: {
      userId: user.id,
      codeHash,
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
    ip,
  });

  // En production réelle : SMS via passerelle ASIN/MTN/Moov.
  // En démo : on retourne le code dans la réponse pour faciliter le test.
  // Pour cacher en prod réelle : HIDE_DEMO_OTP=1
  const hideDemo = process.env.HIDE_DEMO_OTP === "1";

  return NextResponse.json({
    ok: true,
    sent: true,
    phoneMask,
    requiresPassword: false,
    demoCode: hideDemo ? undefined : code,
  });
}
