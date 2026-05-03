import "dotenv/config";
import { createClient } from "@libsql/client";

// Reset complet de la DB Turso : supprime TOUTES les tables (et leurs données).
// À utiliser quand des migrations cumulées ne peuvent plus être rejouées proprement.
// À combiner ensuite avec `db:setup-turso` qui recrée tout from scratch.

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) {
    console.error("TURSO_DATABASE_URL manquante");
    process.exit(1);
  }

  const client = createClient({ url, authToken });

  console.log(`→ Cible : ${url}`);
  console.log("⚠ TOUTES les tables vont être supprimées.\n");

  // Liste les tables (hors système)
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream_%'",
  );

  if (tables.rows.length === 0) {
    console.log("✓ Aucune table à supprimer.");
    await client.close();
    return;
  }

  // Désactive les FK pour pouvoir drop dans n'importe quel ordre
  await client.execute("PRAGMA foreign_keys = OFF");

  for (const row of tables.rows) {
    const name = row.name as string;
    try {
      await client.execute(`DROP TABLE IF EXISTS "${name}"`);
      console.log(`  ✓ DROP ${name}`);
    } catch (e) {
      console.error(`  ✗ ${name} : ${(e as Error).message}`);
    }
  }

  await client.execute("PRAGMA foreign_keys = ON");

  console.log("\n✓ Reset terminé. Lance maintenant : npm run db:setup-turso");
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
