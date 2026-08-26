-- 0001_init.sql — base schema for the personal website.
-- Applied by `npm run db:migrate`, which records it in the _migrations table.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Admin users who can sign in at /admin.
CREATE TABLE IF NOT EXISTS admins (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Portfolio projects rendered on /projects and the home page.
CREATE TABLE IF NOT EXISTS projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  slug          text NOT NULL UNIQUE,
  description   text NOT NULL,
  tech          text[] NOT NULL DEFAULT '{}',
  demo_url      text,
  repo_url      text,
  thumbnail_url text,
  featured      boolean NOT NULL DEFAULT false,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_sort_idx ON projects (sort_order ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS projects_featured_idx ON projects (featured) WHERE featured;

-- Blog posts. Only rows with published = true are exposed publicly.
CREATE TABLE IF NOT EXISTS posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  slug         text NOT NULL UNIQUE,
  excerpt      text,
  body         text NOT NULL,
  cover_url    text,
  tags         text[] NOT NULL DEFAULT '{}',
  published    boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_published_idx ON posts (published, published_at DESC);

-- Contact-form submissions. Readable only by an authenticated admin.
CREATE TABLE IF NOT EXISTS contact_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text NOT NULL,
  message    text NOT NULL,
  ip         text,
  user_agent text,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_created_idx ON contact_messages (created_at DESC);
-- Supports the per-IP flood check in POST /api/contact.
CREATE INDEX IF NOT EXISTS contact_ip_created_idx ON contact_messages (ip, created_at DESC);
