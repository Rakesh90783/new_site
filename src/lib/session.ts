import { SignJWT, jwtVerify } from "jose";
import type { SessionUser } from "./types";

/**
 * Session token helpers. Deliberately dependency-light and free of any Node-only
 * imports (no `pg`, no `bcryptjs`) so this module can also be used from
 * middleware, which runs on the Edge runtime.
 *
 * The session is a signed — not encrypted — JWT in an httpOnly cookie. It
 * carries only the admin id, email, and display name; never a password hash.
 */

export const SESSION_COOKIE = "portfolio_session";

/** Seven days. Re-issued on each successful login, not refreshed on use. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or shorter than 32 characters. Generate one with:\n" +
        '  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"'
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

/** Returns the session user, or null if the token is absent, expired, or forged. */
export async function verifySession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return {
      sub: payload.sub,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : null,
    };
  } catch {
    // Covers bad signature, expiry, and malformed tokens alike — all mean "not signed in".
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
