import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/logout
 *
 * Clears the session cookie. Always succeeds, even when no session was present,
 * so a double logout is not an error.
 */
export async function POST() {
  const res = NextResponse.json({ data: { signedOut: true } });
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return res;
}
