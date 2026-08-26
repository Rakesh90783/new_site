/** Row shapes as returned by the database, plus the public-facing DTOs. */

export type Project = {
  id: string;
  title: string;
  slug: string;
  description: string;
  tech: string[];
  demo_url: string | null;
  repo_url: string | null;
  thumbnail_url: string | null;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  cover_url: string | null;
  tags: string[];
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  ip: string | null;
  user_agent: string | null;
  is_read: boolean;
  created_at: string;
};

export type Admin = {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: string;
  updated_at: string;
};

/** The admin identity carried in the session JWT. */
export type SessionUser = {
  sub: string;
  email: string;
  name: string | null;
};
