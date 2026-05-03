import "dotenv/config";
import { createClient } from "@libsql/client";
import { promises as fs } from "fs";
import path from "path";

type LibsqlClient = ReturnType<typeof createClient>;

async function runStatementWithRetry(
  client: LibsqlClient,
  stmt: string,
): Promise<"applied" | "skipped"> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await client.execute(stmt);
      return "applied";
    } catch (e) {
      const msg = (e as Error).message;
      // Idempotence
      if (
        msg.includes("already exists") ||
        msg.includes("duplicate column name") ||
        msg.includes("no such column") ||
        msg.includes("no such table")
      ) {
        return "skipped";
      }
      // Réseau retry-able
      if (
        msg.includes("ENOTFOUND") ||
        msg.includes("ECONNRESET") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("fetch failed") ||
        msg.includes("getaddrinfo")
      ) {
        const wait = 1000 * Math.pow(2, attempt - 1);
        console.log(`    ↻ Erreur réseau, retry ${attempt}/4 dans ${wait}ms...`);
        await new Promise((r) => setTimeout(r, wait));
        lastError = e;
        continue;
      }
      console.error(`    ✗ ${msg}`);
      console.error(`    Statement : ${stmt.slice(0, 120)}...`);
      throw e;
    }
  }
  console.error("    ✗ Réseau indisponible après 4 tentatives");
  throw lastError;
}

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

    // Découpe sur ; en fin de statement.
    // Strip les lignes de commentaires en DÉBUT de chaque statement seulement
    // (pour ne pas re-confondre un commentaire `-- CreateTable` avec un
    // statement entier comme c'était le cas avant).
    const statements = sql
      .split(/;\s*\n/)
      .map((s) => s.replace(/^\s*(--[^\n]*\n)+/g, "").trim())
      .filter((s) => s.length > 0);

    let applied = 0;
    let skipped = 0;
    for (const stmt of statements) {
      const result = await runStatementWithRetry(client, stmt);
      if (result === "applied") applied++;
      else if (result === "skipped") skipped++;
    }
    console.log(`    ✓ ${applied} statement(s) appliqué(s), ${skipped} déjà présent(s)`);
  }

  // Vérification : compter les tables après push
  const check = await client.execute(
    "SELECT count(*) as n FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'",
  );
  const tableCount = (check.rows[0] as unknown as { n: number }).n;
  console.log(`\n→ Tables présentes sur Turso après migration : ${tableCount}`);
  console.log(`✓ Toutes les migrations ont été appliquées sur Turso.`);
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
