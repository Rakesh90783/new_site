#!/usr/bin/env node
/**
 * Applies every .sql file in ./migrations that has not been applied yet.
 *
 *   npm run db:migrate
 *
 * Migrations run in filename order (0001_, 0002_, ...) and each one runs inside
 * a transaction, so a failing migration leaves the database untouched. Applied
 * filenames are recorded in the _migrations table, making reruns a no-op.
 */
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// .env.local wins over .env, matching Next.js precedence.
dotenv.config({ path: join(root, ".env.local") });
dotenv.config({ path: join(root, ".env") });

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in."
  );
  process.exit(1);
}

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename   text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  const { rows } = await client.query("SELECT filename FROM _migrations");
  const applied = new Set(rows.map((r) => r.filename));

  const dir = join(root, "migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  skip  ${file} (already applied)`);
      continue;
    }
    const sql = await readFile(join(dir, file), "utf8");
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO _migrations (filename) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`  apply ${file}`);
      count += 1;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`\nMigration ${file} failed and was rolled back:\n`, err.message);
      process.exitCode = 1;
      return;
    }
  }

  console.log(
    count === 0
      ? "\nDatabase already up to date."
      : `\nApplied ${count} migration${count === 1 ? "" : "s"}.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.end());
