import { requireAdmin } from "@/lib/auth";
import {
  badRequest,
  conflict,
  created,
  isUniqueViolation,
  ok,
  parseBody,
  serverError,
  unauthorized,
} from "@/lib/api";
import { insertPost, listAllPosts, listPublishedPosts } from "@/lib/queries";
import { postInput } from "@/lib/schemas";

export const dynamic = "force-dynamic";

/**
 * GET /api/posts — published posts only for anonymous callers. A signed-in admin
 * gets drafts too, which is what the dashboard list uses.
 */
export async function GET() {
  try {
    const user = await requireAdmin();
    return ok(user ? await listAllPosts() : await listPublishedPosts());
  } catch (err) {
    return serverError(err);
  }
}

/** POST /api/posts — admin only. */
export async function POST(req: Request) {
  const user = await requireAdmin();
  if (!user) return unauthorized();

  const parsed = await parseBody(req, postInput);
  if (!parsed.ok) return parsed.response;

  try {
    return created(await insertPost(parsed.data));
  } catch (err) {
    if (isUniqueViolation(err)) {
      return conflict(`A post with the slug "${parsed.data.slug}" already exists`);
    }
    return serverError(err);
  }
}

export async function PUT() {
  return badRequest("Use PUT /api/posts/{id} to update a single post");
}

export async function DELETE() {
  return badRequest("Use DELETE /api/posts/{id} to delete a single post");
}
