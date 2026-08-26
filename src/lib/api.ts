import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

/** Shared JSON response shapes and body parsing for the /api routes. */

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function badRequest(message: string, fields?: Record<string, string[]>) {
  return NextResponse.json({ error: message, fields }, { status: 400 });
}

export function unauthorized() {
  return NextResponse.json({ error: "Sign in required" }, { status: 401 });
}

export function notFound(what = "Resource") {
  return NextResponse.json({ error: `${what} not found` }, { status: 404 });
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function tooMany(message: string) {
  return NextResponse.json({ error: message }, { status: 429 });
}

export function serverError(err: unknown) {
  // Log the detail server-side; return something generic to the client.
  console.error("[api]", err);
  return NextResponse.json({ error: "Something went wrong on our end" }, { status: 500 });
}

type ParseResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

/**
 * Parses and validates a JSON request body.
 *
 *   const parsed = await parseBody(req, projectInput);
 *   if (!parsed.ok) return parsed.response;
 *   parsed.data // fully typed
 */
export async function parseBody<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<ParseResult<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, response: badRequest("Request body must be valid JSON") };
  }

  try {
    return { ok: true, data: schema.parse(raw) };
  } catch (err) {
    if (err instanceof ZodError) {
      const fields: Record<string, string[]> = {};
      for (const issue of err.issues) {
        const key = issue.path.join(".") || "_";
        (fields[key] ??= []).push(issue.message);
      }
      return {
        ok: false,
        response: badRequest(err.issues[0]?.message ?? "Invalid input", fields),
      };
    }
    throw err;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Ids are uuids. Checking the shape first turns a garbage id into a clean 404
 * instead of a Postgres "invalid input syntax for type uuid" 500.
 */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** True when Postgres rejected the write because of a unique index. */
export function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}

/** Best-effort client IP from the proxy headers Vercel sets. */
export function clientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip");
}
