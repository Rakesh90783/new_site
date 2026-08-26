import { requireAdmin } from "@/lib/auth";
import {
  clientIp,
  created,
  ok,
  parseBody,
  serverError,
  tooMany,
  unauthorized,
} from "@/lib/api";
import { countRecentByIp, insertContactMessage, listContactMessages } from "@/lib/queries";
import { contactInput } from "@/lib/schemas";
import { sendContactNotification } from "@/lib/email";

export const dynamic = "force-dynamic";

/** Max submissions accepted from one IP within the window below. */
const FLOOD_LIMIT = 5;
const FLOOD_WINDOW_MINUTES = 10;

/** POST /api/contact — public. Saves the message, then emails a notification. */
export async function POST(req: Request) {
  const parsed = await parseBody(req, contactInput);
  if (!parsed.ok) return parsed.response;

  const { name, email, message, honeypot } = parsed.data;

  // A filled honeypot means a bot. Return 201 so it does not learn anything.
  if (honeypot) {
    return created({ id: null, queued: true });
  }

  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent");

  try {
    // Counted in Postgres rather than in memory, so the limit holds across the
    // many short-lived serverless instances a burst gets spread over.
    if (ip) {
      const recent = await countRecentByIp(ip, FLOOD_WINDOW_MINUTES);
      if (recent >= FLOOD_LIMIT) {
        return tooMany(
          `That is ${FLOOD_LIMIT} messages in ${FLOOD_WINDOW_MINUTES} minutes. Please try again later.`
        );
      }
    }

    const saved = await insertContactMessage({
      name,
      email,
      message,
      ip,
      user_agent: userAgent,
    });

    // Awaited but never fatal: the message is already durably stored, so a mail
    // failure is logged and the visitor still sees success.
    const mail = await sendContactNotification({
      name,
      email,
      message,
      receivedAt: new Date(saved.created_at),
    });
    if (!mail.sent) {
      console.warn(`[contact] saved ${saved.id} but no email sent: ${mail.reason}`);
    }

    return created({ id: saved.id, emailed: mail.sent });
  } catch (err) {
    return serverError(err);
  }
}

/** GET /api/contact — admin only. Newest submissions first. */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return unauthorized();

  try {
    return ok(await listContactMessages());
  } catch (err) {
    return serverError(err);
  }
}
