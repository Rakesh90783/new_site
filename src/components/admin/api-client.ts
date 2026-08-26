/** Thin fetch wrapper for the admin dashboard. Throws with the API's message. */

type ApiError = { error?: string; fields?: Record<string, string[]> };

export class RequestFailed extends Error {
  fields?: Record<string, string[]>;
  status: number;

  constructor(message: string, status: number, fields?: Record<string, string[]>) {
    super(message);
    this.name = "RequestFailed";
    this.status = status;
    this.fields = fields;
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(path, {
    method: init.method ?? "GET",
    headers: init.body ? { "Content-Type": "application/json" } : undefined,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  const payload = (await res.json().catch(() => ({}))) as ApiError & { data?: T };

  if (!res.ok) {
    throw new RequestFailed(
      payload.error ?? `Request failed (HTTP ${res.status})`,
      res.status,
      payload.fields
    );
  }

  return payload.data as T;
}
