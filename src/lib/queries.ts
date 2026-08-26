import "server-only";
import { query, queryOne } from "./db";
import type { ContactMessage, Post, Project } from "./types";

/**
 * All SQL lives here so pages, route handlers, and the admin dashboard share one
 * definition of "a published post" or "the project ordering".
 */

const PROJECT_COLUMNS = `
  id, title, slug, description, tech, demo_url, repo_url, thumbnail_url,
  featured, sort_order, created_at, updated_at
`;

const POST_LIST_COLUMNS = `
  id, title, slug, excerpt, cover_url, tags, published, published_at,
  created_at, updated_at
`;

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export function listProjects(): Promise<Project[]> {
  return query<Project>(
    `SELECT ${PROJECT_COLUMNS} FROM projects
     ORDER BY sort_order ASC, created_at DESC`
  );
}

export function listFeaturedProjects(limit = 3): Promise<Project[]> {
  return query<Project>(
    `SELECT ${PROJECT_COLUMNS} FROM projects
     ORDER BY featured DESC, sort_order ASC, created_at DESC
     LIMIT $1`,
    [limit]
  );
}

export function getProject(id: string): Promise<Project | null> {
  return queryOne<Project>(`SELECT ${PROJECT_COLUMNS} FROM projects WHERE id = $1`, [id]);
}

export function getProjectBySlug(slug: string): Promise<Project | null> {
  return queryOne<Project>(`SELECT ${PROJECT_COLUMNS} FROM projects WHERE slug = $1`, [slug]);
}

type ProjectWrite = {
  title: string;
  slug: string;
  description: string;
  tech: string[];
  demo_url: string | null;
  repo_url: string | null;
  thumbnail_url: string | null;
  featured: boolean;
  sort_order: number;
};

export async function insertProject(p: ProjectWrite): Promise<Project> {
  const row = await queryOne<Project>(
    `INSERT INTO projects
       (title, slug, description, tech, demo_url, repo_url, thumbnail_url, featured, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING ${PROJECT_COLUMNS}`,
    [
      p.title,
      p.slug,
      p.description,
      p.tech,
      p.demo_url,
      p.repo_url,
      p.thumbnail_url,
      p.featured,
      p.sort_order,
    ]
  );
  // RETURNING on a successful INSERT always yields a row.
  return row!;
}

/**
 * Partial update. Builds the SET list from only the keys actually present, so
 * omitting a field leaves it alone rather than nulling it.
 */
export async function updateProject(
  id: string,
  patch: Partial<ProjectWrite>
): Promise<Project | null> {
  const allowed: (keyof ProjectWrite)[] = [
    "title",
    "slug",
    "description",
    "tech",
    "demo_url",
    "repo_url",
    "thumbnail_url",
    "featured",
    "sort_order",
  ];

  const sets: string[] = [];
  const values: unknown[] = [];
  for (const key of allowed) {
    if (key in patch) {
      values.push(patch[key]);
      sets.push(`${key} = $${values.length}`);
    }
  }
  if (sets.length === 0) return getProject(id);

  sets.push("updated_at = now()");
  values.push(id);

  return queryOne<Project>(
    `UPDATE projects SET ${sets.join(", ")}
     WHERE id = $${values.length}
     RETURNING ${PROJECT_COLUMNS}`,
    values
  );
}

export async function deleteProject(id: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    "DELETE FROM projects WHERE id = $1 RETURNING id",
    [id]
  );
  return row !== null;
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

/** Public list: published only, newest first. */
export function listPublishedPosts(): Promise<Post[]> {
  return query<Post>(
    `SELECT ${POST_LIST_COLUMNS}, '' AS body FROM posts
     WHERE published
     ORDER BY published_at DESC NULLS LAST, created_at DESC`
  );
}

/** Admin list: drafts included. */
export function listAllPosts(): Promise<Post[]> {
  return query<Post>(
    `SELECT ${POST_LIST_COLUMNS}, body FROM posts
     ORDER BY COALESCE(published_at, created_at) DESC`
  );
}

export function getPublishedPostBySlug(slug: string): Promise<Post | null> {
  return queryOne<Post>(
    `SELECT ${POST_LIST_COLUMNS}, body FROM posts WHERE slug = $1 AND published`,
    [slug]
  );
}

export function getPost(id: string): Promise<Post | null> {
  return queryOne<Post>(`SELECT ${POST_LIST_COLUMNS}, body FROM posts WHERE id = $1`, [id]);
}

type PostWrite = {
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  cover_url: string | null;
  tags: string[];
  published: boolean;
};

export async function insertPost(p: PostWrite): Promise<Post> {
  const row = await queryOne<Post>(
    `INSERT INTO posts (title, slug, excerpt, body, cover_url, tags, published, published_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7, CASE WHEN $7 THEN now() ELSE NULL END)
     RETURNING ${POST_LIST_COLUMNS}, body`,
    [p.title, p.slug, p.excerpt, p.body, p.cover_url, p.tags, p.published]
  );
  return row!;
}

export async function updatePost(id: string, patch: Partial<PostWrite>): Promise<Post | null> {
  const allowed: (keyof PostWrite)[] = [
    "title",
    "slug",
    "excerpt",
    "body",
    "cover_url",
    "tags",
    "published",
  ];

  const sets: string[] = [];
  const values: unknown[] = [];
  for (const key of allowed) {
    if (key in patch) {
      values.push(patch[key]);
      sets.push(`${key} = $${values.length}`);
    }
  }
  if (sets.length === 0) return getPost(id);

  // Stamp published_at the first time a post goes live; keep the original date
  // on later edits, and clear it if the post is unpublished again.
  if ("published" in patch) {
    if (patch.published) {
      sets.push("published_at = COALESCE(published_at, now())");
    } else {
      sets.push("published_at = NULL");
    }
  }

  sets.push("updated_at = now()");
  values.push(id);

  return queryOne<Post>(
    `UPDATE posts SET ${sets.join(", ")}
     WHERE id = $${values.length}
     RETURNING ${POST_LIST_COLUMNS}, body`,
    values
  );
}

export async function deletePost(id: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>("DELETE FROM posts WHERE id = $1 RETURNING id", [
    id,
  ]);
  return row !== null;
}

// ---------------------------------------------------------------------------
// Contact messages
// ---------------------------------------------------------------------------

export async function insertContactMessage(m: {
  name: string;
  email: string;
  message: string;
  ip: string | null;
  user_agent: string | null;
}): Promise<ContactMessage> {
  const row = await queryOne<ContactMessage>(
    `INSERT INTO contact_messages (name, email, message, ip, user_agent)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, name, email, message, ip, user_agent, is_read, created_at`,
    [m.name, m.email, m.message, m.ip, m.user_agent]
  );
  return row!;
}

export function listContactMessages(limit = 200): Promise<ContactMessage[]> {
  return query<ContactMessage>(
    `SELECT id, name, email, message, ip, user_agent, is_read, created_at
     FROM contact_messages
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
}

export async function markContactRead(id: string, isRead: boolean): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    "UPDATE contact_messages SET is_read = $2 WHERE id = $1 RETURNING id",
    [id, isRead]
  );
  return row !== null;
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    "DELETE FROM contact_messages WHERE id = $1 RETURNING id",
    [id]
  );
  return row !== null;
}

/** How many messages this IP has sent in the last `minutes`. Feeds the flood check. */
export async function countRecentByIp(ip: string, minutes = 10): Promise<number> {
  const row = await queryOne<{ n: string }>(
    `SELECT count(*)::text AS n FROM contact_messages
     WHERE ip = $1 AND created_at > now() - ($2 || ' minutes')::interval`,
    [ip, String(minutes)]
  );
  return row ? Number(row.n) : 0;
}
