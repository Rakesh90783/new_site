-- ===========================================================================
-- seed.sql — no-Node setup path
--
-- Use this INSTEAD OF `npm run db:seed` when you cannot run Node locally.
-- Everything here runs inside Postgres, using pgcrypto to produce the same
-- bcrypt hash format that bcryptjs verifies at login.
--
-- HOW TO RUN
--   1. Open your database's SQL editor:
--        Neon     -> project -> SQL Editor
--        Supabase -> project -> SQL Editor -> New query
--   2. Paste and run migrations/0001_init.sql first (creates the tables).
--   3. Change the password on the line marked CHANGE THIS below.
--   4. Paste and run this whole file.
--
-- Safe to rerun: every statement is idempotent. Existing rows are left alone,
-- so this will not overwrite content you have edited in the /admin dashboard.
-- ===========================================================================

-- pgcrypto gives us crypt() and gen_salt(), used for the admin password below.
-- 0001_init.sql already enables it; repeated here so this file stands alone.
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ---------------------------------------------------------------------------
-- 1. Record that 0001_init.sql has been applied.
--
-- scripts/migrate.mjs tracks applied migrations in this table. Recording it now
-- means that if you install Node later, `npm run db:migrate` will correctly skip
-- 0001 instead of trying to reapply it.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS _migrations (
  filename   text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO _migrations (filename)
VALUES ('0001_init.sql')
ON CONFLICT (filename) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 2. Admin account for /admin/login
--
-- gen_salt('bf', 12) produces a bcrypt salt at cost 12 — the same cost the app
-- uses — and crypt() returns a "$2a$12$..." hash that bcryptjs accepts.
--
-- >>> CHANGE THIS <<<  Replace BOTH the email and the password below.
-- Pick something long. Do not reuse a password from another service.
-- ---------------------------------------------------------------------------
INSERT INTO admins (email, password_hash, name)
VALUES (
  lower(trim('meherrakesh2019@gmail.com')),
  crypt('CHANGE-THIS-PASSWORD-BEFORE-RUNNING', gen_salt('bf', 12)),
  'Rakesh Meher'
)
ON CONFLICT (email) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 3. Starter projects
--
-- Mirrors scripts/seed.mjs. Replace the placeholder rows from the dashboard
-- once you are signed in — that is easier than editing SQL.
-- ---------------------------------------------------------------------------
INSERT INTO projects (title, slug, description, tech, demo_url, repo_url, thumbnail_url, featured, sort_order)
VALUES
  (
    'Informatica Daily Admin Health Report',
    'informatica-health-report',
    'Shell-based monitoring job that sweeps Informatica PowerCenter repositories every morning and emails a consolidated health report — service status, failed sessions, disk headroom, and long-running workflows.',
    ARRAY['Bash', 'Informatica PowerCenter', 'Oracle', 'cron', 'Ansible'],
    NULL, NULL, NULL, true, 1
  ),
  (
    'Project Two',
    'project-two',
    'PLACEHOLDER — replace this from the /admin dashboard. One or two sentences on what the project does, who it is for, and the interesting technical problem you solved.',
    ARRAY['TypeScript', 'React', 'Postgres'],
    NULL, NULL, NULL, true, 2
  ),
  (
    'Project Three',
    'project-three',
    'PLACEHOLDER — replace this from the /admin dashboard. One or two sentences on what the project does, who it is for, and the interesting technical problem you solved.',
    ARRAY['Python', 'Airflow', 'AWS'],
    NULL, NULL, NULL, false, 3
  )
ON CONFLICT (slug) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 4. One published post, so /blog is not empty
-- ---------------------------------------------------------------------------
INSERT INTO posts (title, slug, excerpt, body, tags, published, published_at)
VALUES (
  'Hello, world',
  'hello-world',
  'Why I built this site, and what I plan to write about here.',
  E'This is the first post on my new site. Edit or delete it from the [admin dashboard](/admin).\n\n## What I write about\n\n- Data engineering and ETL pipelines that survive contact with production\n- Automation: the boring scripts that quietly save a team hours a week\n- Notes on things I got wrong the first time\n\n## Markdown works\n\nPosts are stored as Markdown in the `posts.body` column and rendered server-side, so **bold**, `inline code`, lists, and [links](https://example.com) all work.\n\n```bash\n# fenced code blocks too\necho "hello from the blog"\n```\n',
  ARRAY['meta', 'writing'],
  true,
  now()
)
ON CONFLICT (slug) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 5. Check it worked
-- ---------------------------------------------------------------------------
SELECT 'admins'   AS table_name, count(*) AS rows FROM admins
UNION ALL SELECT 'projects', count(*) FROM projects
UNION ALL SELECT 'posts',    count(*) FROM posts
UNION ALL SELECT 'contact_messages', count(*) FROM contact_messages;
-- Expect: admins 1, projects 3, posts 1, contact_messages 0
