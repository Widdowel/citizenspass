import { createClient } from "@libsql/client";
import { promises as fs } from "fs";
import path from "path";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) {
    console.error("TURSO_DATABASE_URL manquante");
    process.exit(1);
  }

  const client = createClient({ url, authToken });

  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  const dirs = (await fs.readdir(migrationsDir, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  console.log(`→ Cible : ${url}`);
  console.log(`→ ${dirs.length} migration(s) à appliquer`);

  for (const dir of dirs) {
    const file = path.join(migrationsDir, dir, "migration.sql");
    const sql = await fs.readFile(file, "utf-8");
    console.log(`\n  ▶ ${dir}`);

    // Découpe sur les ; en début/fin de ligne pour exécuter chaque statement
    const statements = sql
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const stmt of statements) {
      try {
        await client.execute(stmt);
      } catch (e) {
        const msg = (e as Error).message;
        // Ignore les erreurs "already exists" si on relance
        if (msg.includes("already exists")) {
          console.log(`    ⚠ déjà appliqué`);
          continue;
        }
        console.error(`    ✗ ${msg}`);
        throw e;
      }
    }
    console.log(`    ✓ appliquée`);
  }

  console.log(`\n✓ Toutes les migrations ont été appliquées sur Turso.`);
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
