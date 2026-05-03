import "dotenv/config";
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

    try {
      await client.executeMultiple(sql);
      console.log(`    ✓ appliquée`);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("already exists")) {
        console.log(`    ⚠ déjà appliquée (skip)`);
        continue;
      }
      console.error(`    ✗ ${msg}`);
      throw e;
    }
  }

  // Vérification : compter les tables après push
  const check = await client.execute(
    "SELECT count(*) as n FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
  );
  const tableCount = (check.rows[0] as unknown as { n: number }).n;
  console.log(`\n→ Tables présentes sur Turso après migration : ${tableCount}`);

  console.log(`\n✓ Toutes les migrations ont été appliquées sur Turso.`);
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
