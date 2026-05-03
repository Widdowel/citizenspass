import "dotenv/config";
import { promises as fs } from "fs";

const VERCEL_URL = "https://citizenspass.vercel.app";
const TURSO_HOST = "citizenspass-widdowel.aws-eu-west-1.turso.io";
const TURSO_URL = "libsql" + "://" + TURSO_HOST;

async function main() {
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!tursoToken) {
    console.error("✗ TURSO_AUTH_TOKEN absent du .env");
    process.exit(1);
  }
  if (!authSecret) {
    console.error("✗ AUTH_SECRET / NEXTAUTH_SECRET absent du .env");
    process.exit(1);
  }

  const lines = [
    `DATABASE_URL="file:./dev.db"`,
    `TURSO_DATABASE_URL="${TURSO_URL}"`,
    `TURSO_AUTH_TOKEN="${tursoToken}"`,
    `NEXTAUTH_SECRET="${authSecret}"`,
    `AUTH_SECRET="${authSecret}"`,
    `NEXTAUTH_URL="${VERCEL_URL}"`,
  ];

  await fs.writeFile(".env.vercel", lines.join("\n") + "\n", "utf-8");

  console.log("✓ .env.vercel généré avec :");
  console.log(`  NEXTAUTH_URL = ${VERCEL_URL}`);
  console.log(`  TURSO_DATABASE_URL = ${TURSO_URL}`);
  console.log(`  TURSO_AUTH_TOKEN  = ${tursoToken.slice(0, 20)}...`);
  console.log(`\nImporte ce fichier sur Vercel : Settings → Environment Variables → Import .env`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
