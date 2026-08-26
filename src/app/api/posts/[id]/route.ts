import { requireAdmin } from "@/lib/auth";
import {
  conflict,
  isUniqueViolation,
  isUuid,
  notFound,
  ok,
  parseBody,
  serverError,
  unauthorized,
} from "@/lib/api";
import { deletePost, getPost, updatePost } from "@/lib/queries";
import { postPatch } from "@/lib/schemas";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/posts/{id} — drafts are visible to admins only. */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!isUuid(id)) return notFound("Post");

    const post = await getPost(id);
    if (!post) return notFound("Post");

    if (!post.published) {
      const user = await requireAdmin();
      if (!user) return notFound("Post");
    }
    return ok(post);
  } catch (err) {
    return serverError(err);
  }
}

/** PUT /api/posts/{id} — admin only. */
export async function PUT(req: Request, { params }: Ctx) {
  const user = await requireAdmin();
  if (!user) return unauthorized();

  const { id } = await params;
  if (!isUuid(id)) return notFound("Post");

  const parsed = await parseBody(req, postPatch);
  if (!parsed.ok) return parsed.response;

  try {
    const post = await updatePost(id, parsed.data);
    return post ? ok(post) : notFound("Post");
  } catch (err) {
    if (isUniqueViolation(err)) return conflict("Another post already uses that slug");
    return serverError(err);
  }
}

/** DELETE /api/posts/{id} — admin only. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await requireAdmin();
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    if (!isUuid(id)) return notFound("Post");
    const removed = await deletePost(id);
    return removed ? ok({ id, deleted: true }) : notFound("Post");
  } catch (err) {
    return serverError(err);
  }
}
