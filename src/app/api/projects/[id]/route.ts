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
import { deleteProject, getProject, updateProject } from "@/lib/queries";
import { projectPatch } from "@/lib/schemas";

export const dynamic = "force-dynamic";

// In Next 15, dynamic route params arrive as a Promise.
type Ctx = { params: Promise<{ id: string }> };

/** GET /api/projects/{id} — public. */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!isUuid(id)) return notFound("Project");
    const project = await getProject(id);
    return project ? ok(project) : notFound("Project");
  } catch (err) {
    return serverError(err);
  }
}

/** PUT /api/projects/{id} — admin only. Partial update; omitted fields are untouched. */
export async function PUT(req: Request, { params }: Ctx) {
  const user = await requireAdmin();
  if (!user) return unauthorized();

  const { id } = await params;
  if (!isUuid(id)) return notFound("Project");

  const parsed = await parseBody(req, projectPatch);
  if (!parsed.ok) return parsed.response;

  try {
    const project = await updateProject(id, parsed.data);
    return project ? ok(project) : notFound("Project");
  } catch (err) {
    if (isUniqueViolation(err)) return conflict("Another project already uses that slug");
    return serverError(err);
  }
}

/** DELETE /api/projects/{id} — admin only. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await requireAdmin();
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    if (!isUuid(id)) return notFound("Project");
    const removed = await deleteProject(id);
    return removed ? ok({ id, deleted: true }) : notFound("Project");
  } catch (err) {
    return serverError(err);
  }
}
