import { NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/auth";
import { parseBody, serverError } from "@/lib/api";
import { loginInput } from "@/lib/schemas";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/login
 *
 * On success, sets an httpOnly session cookie. The failure message is
 * deliberately identical for "no such account" and "wrong password".
 */
export async function POST(req: Request) {
  const parsed = await parseBody(req, loginInput);
  if (!parsed.ok) return parsed.response;

  try {
    const user = await verifyCredentials(parsed.data.email, parsed.data.password);
    if (!user) {
      return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
    }

    const token = await signSession(user);
    const res = NextResponse.json({
      data: { email: user.email, name: user.name },
    });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  } catch (err) {
    return serverError(err);
  }
}
