import { Pool, type QueryResultRow } from "pg";

/**
 * A single pg Pool per server process.
 *
 * Serverless functions are recycled aggressively, so the pool is cached on
 * globalThis to survive Next.js dev hot-reloads (which would otherwise leak a
 * pool per edit) and reused across warm invocations in production.
 *
 * Point DATABASE_URL at your provider's *pooled* connection string — Neon's
 * `-pooler` host or Supabase's port 6543 — so short-lived function instances do
 * not exhaust the database's direct connection limit.
 */

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local (locally) or add it in the Vercel dashboard."
    );
  }

  const isLocal =
    connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

  return new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    // Small cap: each serverless instance keeps its own pool.
    max: 5,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });
}

export function getPool(): Pool {
  if (!global.__pgPool) {
    global.__pgPool = createPool();
    // Without a listener, an idle-client error crashes the process.
    global.__pgPool.on("error", (err) => {
      console.error("[db] idle client error:", err.message);
    });
  }
  return global.__pgPool;
}

/** Runs a parameterised query and returns the rows. Never interpolate SQL. */
export async function query<T extends QueryResultRow>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const res = await getPool().query<T>(sql, params);
  return res.rows;
}

/** Returns the first row, or null when the query matched nothing. */
export async function queryOne<T extends QueryResultRow>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}
