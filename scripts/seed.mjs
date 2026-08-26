#!/usr/bin/env node
/**
 * Seeds the admin account plus starter projects and one blog post, so the live
 * site is never empty.
 *
 *   npm run db:seed
 *
 * Safe to rerun: every insert is idempotent on the natural key (admin email,
 * project/post slug), so existing rows are left exactly as they are. Edit
 * content in the /admin dashboard, not here — reseeding will not clobber it.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
dotenv.config({ path: join(root, ".env.local") });
dotenv.config({ path: join(root, ".env") });

const {
  DATABASE_URL,
  SEED_ADMIN_EMAIL,
  SEED_ADMIN_PASSWORD,
  SEED_ADMIN_NAME,
} = process.env;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set. See .env.example.");
  process.exit(1);
}
if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
  console.error(
    "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set to seed the admin account. See .env.example."
  );
  process.exit(1);
}
if (SEED_ADMIN_PASSWORD.length < 10) {
  console.error("SEED_ADMIN_PASSWORD must be at least 10 characters.");
  process.exit(1);
}

const PROJECTS = [
  {
    title: "Informatica Daily Admin Health Report",
    slug: "informatica-health-report",
    description:
      "Shell-based monitoring job that sweeps Informatica PowerCenter repositories every morning and emails a consolidated health report — service status, failed sessions, disk headroom, and long-running workflows.",
    tech: ["Bash", "Informatica PowerCenter", "Oracle", "cron", "Ansible"],
    demo_url: null,
    repo_url: null,
    thumbnail_url: null,
    featured: true,
    sort_order: 1,
  },
  {
    title: "Project Two",
    slug: "project-two",
    description:
      "PLACEHOLDER — replace this from the /admin dashboard. One or two sentences on what the project does, who it is for, and the interesting technical problem you solved.",
    tech: ["TypeScript", "React", "Postgres"],
    demo_url: null,
    repo_url: null,
    thumbnail_url: null,
    featured: true,
    sort_order: 2,
  },
  {
    title: "Project Three",
    slug: "project-three",
    description:
      "PLACEHOLDER — replace this from the /admin dashboard. One or two sentences on what the project does, who it is for, and the interesting technical problem you solved.",
    tech: ["Python", "Airflow", "AWS"],
    demo_url: null,
    repo_url: null,
    thumbnail_url: null,
    featured: false,
    sort_order: 3,
  },
];

const POSTS = [
  {
    title: "Hello, world",
    slug: "hello-world",
    excerpt:
      "Why I built this site, and what I plan to write about here.",
    body: `This is the first post on my new site. It is seeded from \`scripts/seed.mjs\` — edit or delete it from the [admin dashboard](/admin).

## What I write about

- Data engineering and ETL pipelines that survive contact with production
- Automation: the boring scripts that quietly save a team hours a week
- Notes on things I got wrong the first time

## Markdown works

Posts are stored as Markdown in the \`posts.body\` column and rendered server-side, so **bold**, \`inline code\`, lists, and [links](https://example.com) all work.

\`\`\`bash
# fenced code blocks too
echo "hello from the blog"
\`\`\`
`,
    tags: ["meta", "writing"],
    published: true,
  },
];

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  // --- admin ---------------------------------------------------------------
  const email = SEED_ADMIN_EMAIL.trim().toLowerCase();
  const hash = bcrypt.hashSync(SEED_ADMIN_PASSWORD, 12);
  const admin = await client.query(
    `INSERT INTO admins (email, password_hash, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [email, hash, SEED_ADMIN_NAME || null]
  );
  console.log(
    admin.rowCount === 1
      ? `  admin   created ${email}`
      : `  admin   ${email} already exists — password left unchanged`
  );

  // --- projects ------------------------------------------------------------
  for (const p of PROJECTS) {
    const res = await client.query(
      `INSERT INTO projects
         (title, slug, description, tech, demo_url, repo_url, thumbnail_url, featured, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (slug) DO NOTHING
       RETURNING id`,
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
    console.log(
      res.rowCount === 1 ? `  project created ${p.slug}` : `  project skip    ${p.slug}`
    );
  }

  // --- posts ---------------------------------------------------------------
  for (const post of POSTS) {
    const res = await client.query(
      `INSERT INTO posts (title, slug, excerpt, body, tags, published, published_at)
       VALUES ($1,$2,$3,$4,$5,$6, CASE WHEN $6 THEN now() ELSE NULL END)
       ON CONFLICT (slug) DO NOTHING
       RETURNING id`,
      [post.title, post.slug, post.excerpt, post.body, post.tags, post.published]
    );
    console.log(
      res.rowCount === 1 ? `  post    created ${post.slug}` : `  post    skip    ${post.slug}`
    );
  }

  console.log("\nSeed complete. Sign in at /admin/login and replace the placeholder content.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.end());
