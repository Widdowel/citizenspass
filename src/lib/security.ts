import { prisma } from "./prisma";

// Rate limiting basé sur DB — pas idéal pour gros volume mais suffisant pour démo
// et conserve les principes de souveraineté (pas de Redis externe).
//
// En production réelle : Redis avec Lua atomic, ou rate limiting au niveau gateway.

export type RateLimitConfig = {
  scope: string;
  max: number;
  windowMs: number;
};

export const RATE_LIMITS = {
  OTP_REQUEST: { scope: "OTP_REQUEST", max: 5, windowMs: 15 * 60 * 1000 }, // 5 / 15min
  OTP_VERIFY: { scope: "OTP_VERIFY", max: 10, windowMs: 15 * 60 * 1000 }, // 10 / 15min
  VERIFY_API: { scope: "VERIFY_API", max: 30, windowMs: 60 * 1000 }, // 30 / min
  PUBLIC_DOC_VERIFY: { scope: "PUBLIC_DOC_VERIFY", max: 60, windowMs: 60 * 1000 }, // 60 / min
} as const;

export async function checkRateLimit(
  config: RateLimitConfig,
  identifier: string,
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const since = new Date(Date.now() - config.windowMs);
  const count = await prisma.rateLimitEvent.count({
    where: {
      scope: config.scope,
      identifier,
      createdAt: { gte: since },
    },
  });
  return {
    allowed: count < config.max,
    remaining: Math.max(0, config.max - count),
    resetAt: new Date(since.getTime() + config.windowMs),
  };
}

export async function recordRateLimit(scope: string, identifier: string) {
  await prisma.rateLimitEvent.create({ data: { scope, identifier } });

  // Cleanup opportuniste : supprime les events de plus de 24h
  if (Math.random() < 0.05) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.rateLimitEvent.deleteMany({
      where: { createdAt: { lt: yesterday } },
    });
  }
}

// Account lock après tentatives échouées répétées
export async function recordOtpFailure(userId: string) {
  const lock = await prisma.accountLock.upsert({
    where: { userId },
    create: { userId, reason: "OTP_FAILED", failCount: 1 },
    update: { failCount: { increment: 1 }, reason: "OTP_FAILED" },
  });

  // Lock 30min si 5 échecs
  if (lock.failCount >= 5 && !lock.lockedUntil) {
    await prisma.accountLock.update({
      where: { userId },
      data: { lockedUntil: new Date(Date.now() + 30 * 60 * 1000) },
    });
  }
  return lock;
}

export async function isAccountLocked(userId: string): Promise<{ locked: boolean; until?: Date }> {
  const lock = await prisma.accountLock.findUnique({ where: { userId } });
  if (!lock || !lock.lockedUntil) return { locked: false };
  if (lock.lockedUntil < new Date()) {
    // expirée, on déverrouille
    await prisma.accountLock.update({
      where: { userId },
      data: { lockedUntil: null, failCount: 0 },
    });
    return { locked: false };
  }
  return { locked: true, until: lock.lockedUntil };
}

export async function clearAccountLock(userId: string) {
  await prisma.accountLock.deleteMany({ where: { userId } });
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
