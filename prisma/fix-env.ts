import { promises as fs } from "fs";
import path from "path";

// URL Turso construite par concat pour être insensible aux transformations markdown
const TURSO_HOST = "citizenspass-widdowel.aws-eu-west-1.turso.io";
const TURSO_URL = "libsql" + "://" + TURSO_HOST;

const envPath = path.join(process.cwd(), ".env");

async function main() {
  let content = "";
  try {
    content = await fs.readFile(envPath, "utf-8");
  } catch {
    content = "";
  }

  const lines = content
    .split(/\r?\n/)
    .filter((l) => l.length > 0 && !l.startsWith("TURSO_DATABASE_URL="));

  lines.push(`TURSO_DATABASE_URL="${TURSO_URL}"`);

  await fs.writeFile(envPath, lines.join("\n") + "\n", "utf-8");

  console.log("✓ .env mis à jour");
  console.log(`  TURSO_DATABASE_URL="${TURSO_URL}"`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
