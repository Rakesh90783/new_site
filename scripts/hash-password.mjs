#!/usr/bin/env node
/**
 * Prints a bcrypt hash for a password, and optionally writes it straight to an
 * admin row. Use this to change the admin password without the dashboard.
 *
 *   npm run admin:hash -- "my new password"
 *       -> prints the hash only
 *
 *   npm run admin:hash -- "my new password" you@example.com
 *       -> updates that admin's password_hash in the database
 *
 * Note: the password appears in your shell history. Clear it afterwards if that
 * matters on this machine.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
dotenv.config({ path: join(root, ".env.local") });
dotenv.config({ path: join(root, ".env") });

const [password, email] = process.argv.slice(2);

if (!password) {
  console.error('Usage: npm run admin:hash -- "<password>" [admin-email]');
  process.exit(1);
}
if (password.length < 10) {
  console.error("Password must be at least 10 characters.");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log(`\nbcrypt hash:\n${hash}\n`);

if (!email) {
  console.log(
    "No email given, so nothing was written. Pass an admin email as the second\n" +
      "argument to update that row, or paste the hash into admins.password_hash yourself."
  );
  process.exit(0);
}

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set, so the database was not updated.");
  process.exit(1);
}

const pg = (await import("pg")).default;
const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
});

try {
  await client.connect();
  const res = await client.query(
    "UPDATE admins SET password_hash = $1, updated_at = now() WHERE email = $2 RETURNING id",
    [hash, email.trim().toLowerCase()]
  );
  if (res.rowCount === 0) {
    console.error(`No admin found with email ${email}. Nothing changed.`);
    process.exitCode = 1;
  } else {
    console.log(`Password updated for ${email}. Existing sessions stay valid until they expire.`);
  }
} finally {
  await client.end();
}
