import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { queryOne } from "./db";
import { SESSION_COOKIE, verifySession } from "./session";
import type { Admin, SessionUser } from "./types";

/**
 * Server-side auth helpers. Node runtime only — bcrypt and `pg` are both
 * unavailable on the Edge, so middleware uses ./session directly instead.
 */

/** Reads and verifies the session cookie. Returns null when not signed in. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/**
 * Checks email + password against the admins table.
 *
 * Returns null for both "no such admin" and "wrong password", and always runs a
 * bcrypt comparison even when the email is unknown, so response timing does not
 * reveal which emails exist.
 */
export async function verifyCredentials(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const admin = await queryOne<Admin>(
    "SELECT id, email, password_hash, name FROM admins WHERE email = $1",
    [email.trim().toLowerCase()]
  );

  // A valid-format bcrypt hash of a value no user can submit. Compared against
  // when the email is unknown purely to keep the timing profile flat.
  const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEe.LMEnCJRPHFqTHfvyPBFDCLBmYUn.LSm";

  const ok = await bcrypt.compare(password, admin?.password_hash ?? DUMMY_HASH);
  if (!ok || !admin) return null;

  return { sub: admin.id, email: admin.email, name: admin.name };
}

/** Hashes a new admin password. Cost 12 ≈ 250ms, which is the point. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Guard for admin-only API routes.
 *
 *   const user = await requireAdmin();
 *   if (!user) return unauthorized();
 */
export async function requireAdmin(): Promise<SessionUser | null> {
  return getSessionUser();
}
