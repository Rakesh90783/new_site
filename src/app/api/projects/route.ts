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
import { insertProject, listProjects } from "@/lib/queries";
import { projectInput } from "@/lib/schemas";

export const dynamic = "force-dynamic";

/** GET /api/projects — public. All projects in display order. */
export async function GET() {
  try {
    return ok(await listProjects());
  } catch (err) {
    return serverError(err);
  }
}

/** POST /api/projects — admin only. Creates a project. */
export async function POST(req: Request) {
  const user = await requireAdmin();
  if (!user) return unauthorized();

  const parsed = await parseBody(req, projectInput);
  if (!parsed.ok) return parsed.response;

  try {
    return created(await insertProject(parsed.data));
  } catch (err) {
    if (isUniqueViolation(err)) {
      return conflict(`A project with the slug "${parsed.data.slug}" already exists`);
    }
    return serverError(err);
  }
}

/** Anything else on the collection is not allowed — /[id] handles PUT and DELETE. */
export async function PUT() {
  return badRequest("Use PUT /api/projects/{id} to update a single project");
}

export async function DELETE() {
  return badRequest("Use DELETE /api/projects/{id} to delete a single project");
}
