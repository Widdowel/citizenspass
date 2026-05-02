import {
  generateKeyPairSync,
  createSign,
  createVerify,
  createHash,
  KeyObject,
  createPublicKey,
} from "crypto";
import { prisma } from "./prisma";
import { AUTHORITIES, type AuthorityCode } from "./constants";

export type SignatureBundle = {
  signature: string;
  signatureAlgo: string;
  keyId: string;
  publicKey: string;
  payloadHash: string;
  authority: string;
  authorityCode: string;
  signedAt: string;
};

function fingerprint(publicKeyPem: string): string {
  const hash = createHash("sha256").update(publicKeyPem).digest("hex");
  return hash.slice(0, 40).match(/.{1,4}/g)!.join(":").toUpperCase();
}

function computeHash(payload: string): string {
  return createHash("sha256").update(payload).digest("hex");
}

async function getOrCreateKey(authorityCode: AuthorityCode) {
  const existing = await prisma.signingKey.findUnique({
    where: { authorityCode },
  });
  if (existing) return existing;

  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  const auth = AUTHORITIES[authorityCode];
  const keyId = fingerprint(publicKey);

  return prisma.signingKey.create({
    data: {
      keyId,
      algorithm: "RSA-2048",
      publicKey,
      privateKeyEnc: privateKey,
      authority: auth.name,
      authorityCode,
    },
  });
}

export async function ensureKeysForAllAuthorities() {
  const codes: AuthorityCode[] = ["COUR_APPEL_COTONOU", "MAIRIE_COTONOU", "DGI"];
  for (const code of codes) {
    await getOrCreateKey(code);
  }
}

export async function signPayload(
  authorityCode: AuthorityCode,
  payload: string,
): Promise<SignatureBundle> {
  const key = await getOrCreateKey(authorityCode);

  const signer = createSign("RSA-SHA256");
  signer.update(payload);
  signer.end();
  const signature = signer.sign(key.privateKeyEnc, "base64");

  return {
    signature,
    signatureAlgo: "RSA-SHA256",
    keyId: key.keyId,
    publicKey: key.publicKey,
    payloadHash: computeHash(payload),
    authority: key.authority,
    authorityCode: key.authorityCode,
    signedAt: new Date().toISOString(),
  };
}

export async function verifySignature(
  payload: string,
  signature: string,
  keyId: string,
): Promise<{
  valid: boolean;
  authority?: string;
  authorityCode?: string;
  publicKey?: string;
  expectedHash?: string;
  actualHash?: string;
}> {
  const key = await prisma.signingKey.findUnique({ where: { keyId } });
  if (!key) {
    return { valid: false, actualHash: computeHash(payload) };
  }

  const verifier = createVerify("RSA-SHA256");
  verifier.update(payload);
  verifier.end();

  let valid = false;
  try {
    valid = verifier.verify(key.publicKey, signature, "base64");
  } catch {
    valid = false;
  }

  return {
    valid,
    authority: key.authority,
    authorityCode: key.authorityCode,
    publicKey: key.publicKey,
    expectedHash: computeHash(payload),
    actualHash: computeHash(payload),
  };
}

export function buildPayload(parts: Record<string, unknown>): string {
  const sorted = Object.keys(parts)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = parts[k];
      return acc;
    }, {});
  return JSON.stringify(sorted);
}

export function publicKeyFingerprint(pem: string): string {
  return fingerprint(pem);
}

// Re-export helpers needed by other modules
export { computeHash };

// Validation helper used by the verify route
export function publicKeyToObject(pem: string): KeyObject {
  return createPublicKey(pem);
}
