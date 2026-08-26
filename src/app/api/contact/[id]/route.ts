import { requireAdmin } from "@/lib/auth";
import { isUuid, notFound, ok, parseBody, serverError, unauthorized } from "@/lib/api";
import { deleteContactMessage, markContactRead } from "@/lib/queries";
import { z } from "zod";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const patchInput = z.object({ is_read: z.coerce.boolean() });

/** PATCH /api/contact/{id} — admin only. Toggles the read flag. */
export async function PATCH(req: Request, { params }: Ctx) {
  const user = await requireAdmin();
  if (!user) return unauthorized();

  const { id } = await params;
  if (!isUuid(id)) return notFound("Message");

  const parsed = await parseBody(req, patchInput);
  if (!parsed.ok) return parsed.response;

  try {
    const updated = await markContactRead(id, parsed.data.is_read);
    return updated ? ok({ id, is_read: parsed.data.is_read }) : notFound("Message");
  } catch (err) {
    return serverError(err);
  }
}

/** DELETE /api/contact/{id} — admin only. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await requireAdmin();
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    if (!isUuid(id)) return notFound("Message");
    const removed = await deleteContactMessage(id);
    return removed ? ok({ id, deleted: true }) : notFound("Message");
  } catch (err) {
    return serverError(err);
  }
}
