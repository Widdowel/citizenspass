import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// Chiffrement enveloppe (KEK) pour les secrets en DB.
// La KEK est dérivée de AUTH_SECRET via scrypt — donc rotation = changer
// AUTH_SECRET + re-chiffrer (à scripter en prod).
//
// En production : la KEK doit venir d'un HSM ou KMS dédié.

const ALGO = "aes-256-gcm";
const IV_LEN = 12;

function deriveKek(): Buffer {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET (ou NEXTAUTH_SECRET) requis pour le chiffrement KEK",
    );
  }
  // Scrypt avec un salt fixe — un vrai déploiement aurait un salt par-tenant
  // ou par-clé, stocké à part.
  return scryptSync(secret, "citizenpass-kek-v1", 32);
}

export type EncryptedSecret = {
  cipherText: string; // base64
  iv: string;         // base64
  tag: string;        // base64
};

export function encryptSecret(plaintext: string): EncryptedSecret {
  const kek = deriveKek();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, kek, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    cipherText: enc.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptSecret(s: EncryptedSecret): string {
  const kek = deriveKek();
  const iv = Buffer.from(s.iv, "base64");
  const tag = Buffer.from(s.tag, "base64");
  const cipher = createDecipheriv(ALGO, kek, iv);
  cipher.setAuthTag(tag);
  const dec = Buffer.concat([
    cipher.update(Buffer.from(s.cipherText, "base64")),
    cipher.final(),
  ]);
  return dec.toString("utf8");
}
