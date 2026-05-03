import "dotenv/config";
import { createClient } from "@libsql/client";
import { promises as fs } from "fs";

async function main() {
  console.log("--- DIAGNOSTIC ---\n");

  // 1. Lire .env brut
  let raw = "";
  try {
    raw = await fs.readFile(".env", "utf-8");
  } catch {
    console.log("✗ .env introuvable");
    return;
  }
  const tursoLine = raw.split(/\r?\n/).find((l) => l.startsWith("TURSO_DATABASE_URL="));
  console.log("1) Ligne TURSO dans .env (raw, longueur =", tursoLine?.length, ")");
  console.log("   ", JSON.stringify(tursoLine));

  // 2. URL lue par Node via dotenv
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  console.log("\n2) URL vue par Node :");
  console.log("   ", JSON.stringify(url));
  console.log("\n3) Token présent ?", token ? "oui (longueur " + token.length + ")" : "NON");

  if (!url) {
    console.log("\n✗ TURSO_DATABASE_URL absente — abandon");
    return;
  }

  // 4. Tenter une connexion + lister les tables
  console.log("\n4) Connexion à Turso...");
  const client = createClient({ url, authToken: token });
  try {
    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    console.log("   ✓ connecté");
    console.log("\n5) Tables présentes :");
    if (tables.rows.length === 0) {
      console.log("   (aucune)");
    } else {
      for (const t of tables.rows) {
        console.log("   - ", t.name);
      }
    }
  } catch (e) {
    console.log("   ✗", (e as Error).message);
  }
  await client.close();
}

main().catch(console.error);
