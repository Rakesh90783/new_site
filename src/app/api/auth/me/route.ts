import { getSessionUser } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/auth/me — who am I? Used by the client to confirm a live session. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  return ok({ email: user.email, name: user.name });
}
