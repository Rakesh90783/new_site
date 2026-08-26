import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./lib/session";

/**
 * Gate for the admin area.
 *
 * This is the first line of defence, not the only one: it keeps unauthenticated
 * visitors from ever rendering the dashboard. Every /api write route still calls
 * requireAdmin() itself, because middleware alone is not an authorisation model.
 *
 * Runs on the Edge runtime, so it imports ./lib/session (jose only) rather than
 * ./lib/auth (which pulls in bcrypt and pg).
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const user = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  // Already signed in and heading for the login page — send them to the dashboard.
  if (pathname === "/admin/login") {
    if (user) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  if (!user) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Only /admin pages. API routes guard themselves so that an unauthenticated
  // call gets a 401 JSON body instead of a 307 to an HTML login page.
  matcher: ["/admin", "/admin/:path*"],
};
