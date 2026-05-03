import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ATTRIBUTE_LABELS, type AttributeKey } from "@/lib/attributes";
import { logAudit } from "@/lib/audit";
import { randomBytes, createHash } from "crypto";
import { checkRateLimit, recordRateLimit, clientIp, RATE_LIMITS } from "@/lib/security";

function hashApiKey(k: string): string {
  return createHash("sha256").update(k).digest("hex");
}

// API publique B2B — un tiers (banque, employeur, ambassade) demande à
// vérifier des attributs d'un citoyen sans recevoir le document complet.
// Le citoyen autorise ensuite via son app BJ PASS.
//
// Auth : pour la démo, on accepte un header X-API-Key correspondant à
// VerifierApp.apiKey. En production : mTLS + signature de la requête.

const DEMO_VERIFIERS: Array<{ apiKey: string; name: string; category: string }> = [
  { apiKey: "demo_bank_bnp_001", name: "BNP Paribas Bénin", category: "BANK" },
  { apiKey: "demo_bank_ecobank_001", name: "Ecobank Bénin", category: "BANK" },
  { apiKey: "demo_employer_unicef_001", name: "UNICEF Bénin", category: "EMPLOYER" },
  { apiKey: "demo_embassy_fr_001", name: "Ambassade de France à Cotonou", category: "EMBASSY" },
  { apiKey: "demo_telecom_mtn_001", name: "MTN Bénin", category: "TELECOM" },
];

async function ensureDemoVerifiers() {
  for (const v of DEMO_VERIFIERS) {
    const apiKeyHash = hashApiKey(v.apiKey);
    await prisma.verifierApp.upsert({
      where: { apiKeyHash },
      create: {
        apiKeyHash,
        apiKeyPrefix: v.apiKey.slice(0, 8),
        name: v.name,
        category: v.category,
      },
      update: {},
    });
  }
}

export async function POST(req: NextRequest) {
  await ensureDemoVerifiers();

  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Header X-API-Key requis" },
      { status: 401 },
    );
  }

  // Rate limit par clé API
  const ip = clientIp(req);
  const rl = await checkRateLimit(RATE_LIMITS.VERIFY_API, apiKey);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit dépassé", retryAfter: rl.resetAt.toISOString() },
      { status: 429 },
    );
  }
  await recordRateLimit(RATE_LIMITS.VERIFY_API.scope, apiKey);

  const verifier = await prisma.verifierApp.findUnique({
    where: { apiKeyHash: hashApiKey(apiKey) },
  });
  if (!verifier || !verifier.isActive) {
    await logAudit({
      actorType: "EXTERNAL_VERIFIER",
      action: "VERIFICATION_AUTH_FAILED",
      metadata: { apiKeyPrefix: apiKey.slice(0, 8) },
      ip,
    });
    return NextResponse.json({ error: "Clé API invalide" }, { status: 403 });
  }

  const body = (await req.json()) as {
    cip: string;
    attributes: AttributeKey[];
    purpose?: string;
    parameters?: Record<string, string>;
  };

  if (!body.cip || !Array.isArray(body.attributes) || body.attributes.length === 0) {
    return NextResponse.json(
      { error: "cip et attributes (array non-vide) requis" },
      { status: 400 },
    );
  }

  const invalid = body.attributes.filter((a) => !(a in ATTRIBUTE_LABELS));
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Attributs inconnus : ${invalid.join(", ")}` },
      { status: 400 },
    );
  }

  // Le citoyen doit exister
  const user = await prisma.user.findUnique({ where: { cip: body.cip } });
  if (!user) {
    return NextResponse.json({ error: "CIP introuvable" }, { status: 404 });
  }

  const verificationId =
    "VER-" + randomBytes(6).toString("hex").toUpperCase();

  const verification = await prisma.verificationRequest.create({
    data: {
      id: verificationId,
      verifierId: verifier.id,
      citizenCip: body.cip,
      citizenId: user.id,
      attributesAsked: JSON.stringify(body.attributes),
      purpose: body.purpose ?? null,
      status: "PENDING",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
    },
  });

  await logAudit({
    actorType: "EXTERNAL_VERIFIER",
    action: "VERIFICATION_REQUESTED",
    resourceType: "VerificationRequest",
    resourceId: verification.id,
    metadata: {
      verifier: verifier.name,
      attributes: body.attributes,
      cip: body.cip,
      purpose: body.purpose,
    },
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });

  // Le tiers reçoit l'ID de la demande. Il va ensuite poller
  // GET /api/v1/verify-attributes/[id] jusqu'à ce que status = AUTHORIZED ou DENIED.
  return NextResponse.json({
    verificationId: verification.id,
    status: "PENDING",
    citizenAuthUrl: `${req.nextUrl.protocol}//${req.nextUrl.host}/dashboard/verifications/${verification.id}`,
    expiresAt: verification.expiresAt,
    attributes: body.attributes.map((k) => ({
      key: k,
      label: ATTRIBUTE_LABELS[k].label,
      sensitivity: ATTRIBUTE_LABELS[k].sensitivity,
    })),
  });
}
