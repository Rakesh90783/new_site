# Personal website

Portfolio, blog, working contact form, and a password-protected admin dashboard.
One Next.js app, one deploy, one URL.

> **Status: not yet built or run.** Node.js is not installed on the machine where
> this was written (`winget` is blocked by group policy there), so nothing in this
> repo has been compiled, linted, or executed. Treat the first `npm run build` as
> the real smoke test — see [Known unknowns](#known-unknowns).

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS 3.4, CSS-variable theme tokens, dark by default |
| Database | Postgres (Neon or Supabase), plain SQL migrations |
| API | Next.js route handlers under `/api` |
| Auth | Email + bcrypt password, HS256 JWT in an httpOnly cookie |
| Email | Resend (optional — the form still works without it) |
| Hosting | Vercel |

Fonts are Inter (body) and Space Grotesk (headings), self-hosted at build time by
`next/font`. Accent colour is deep blue.

---

## Folder structure

```
portfolio/
├─ migrations/              SQL migrations, applied in filename order
│  └─ 0001_init.sql
├─ scripts/
│  ├─ migrate.mjs           npm run db:migrate
│  ├─ seed.mjs              npm run db:seed  (idempotent)
│  └─ hash-password.mjs     npm run admin:hash
├─ public/                  static assets — drop resume.pdf here
├─ src/
│  ├─ content/site.ts       ★ ALL your personal copy lives here
│  ├─ lib/
│  │  ├─ db.ts              pg pool, cached per process
│  │  ├─ queries.ts         every SQL statement in the app
│  │  ├─ auth.ts            bcrypt + session lookup (Node only)
│  │  ├─ session.ts         JWT sign/verify (Edge-safe, used by middleware)
│  │  ├─ schemas.ts         zod request validation
│  │  ├─ api.ts             shared JSON responses, body parsing
│  │  ├─ email.ts           Resend notification
│  │  ├─ slug.ts            title → slug
│  │  └─ types.ts           row shapes
│  ├─ middleware.ts         gates /admin/**
│  ├─ components/
│  │  ├─ site-header.tsx    sticky nav + mobile drawer
│  │  ├─ site-footer.tsx
│  │  ├─ theme-toggle.tsx   dark/light switch
│  │  ├─ reveal.tsx         scroll-in animation
│  │  ├─ project-card.tsx
│  │  ├─ contact-form.tsx
│  │  └─ admin/
│  │     ├─ dashboard.tsx       tab shell
│  │     ├─ login-form.tsx
│  │     ├─ project-editor.tsx  create / edit / delete projects
│  │     ├─ post-editor.tsx     create / edit / delete / publish posts
│  │     ├─ message-list.tsx    read, mark, delete submissions
│  │     └─ api-client.ts
│  └─ app/
│     ├─ layout.tsx         fonts, metadata, JSON-LD, theme script
│     ├─ page.tsx           Home
│     ├─ about/page.tsx
│     ├─ projects/page.tsx
│     ├─ blog/page.tsx
│     ├─ blog/[slug]/page.tsx
│     ├─ contact/page.tsx
│     ├─ admin/page.tsx
│     ├─ admin/login/page.tsx
│     ├─ sitemap.ts         /sitemap.xml
│     ├─ robots.ts          /robots.txt
│     ├─ opengraph-image.tsx generated OG card
│     ├─ error.tsx          render-error boundary
│     ├─ not-found.tsx
│     ├─ globals.css        theme tokens + component classes
│     └─ api/
│        ├─ projects/route.ts          GET, POST
│        ├─ projects/[id]/route.ts     GET, PUT, DELETE
│        ├─ posts/route.ts             GET, POST
│        ├─ posts/[id]/route.ts        GET, PUT, DELETE
│        ├─ contact/route.ts           POST (public), GET (admin)
│        ├─ contact/[id]/route.ts      PATCH, DELETE (admin)
│        └─ auth/{login,logout,me}/route.ts
├─ .env.example
├─ tailwind.config.ts
├─ next.config.ts
└─ package.json
```

---

## Local setup

### 1. Prerequisites

- **Node.js 20.9+** (22 LTS recommended) — <https://nodejs.org>
- A Postgres database. Free tiers: [Neon](https://neon.tech) or
  [Supabase](https://supabase.com).

Verify Node is on your PATH:

```bash
node --version
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a database

**Neon** (fewest steps): sign up → *Create project* → copy the **Pooled
connection** string from the dashboard. It looks like:

```
postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

**Supabase**: *Project Settings → Database → Connection string → URI*, and use
the **port 6543** (pooled) variant.

Use the pooled string, not the direct one — serverless functions open and drop
connections constantly and will exhaust a direct connection limit.

### 4. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`. Generate the auth secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### 5. Migrate and seed

```bash
npm run db:setup
```

That runs `db:migrate` (creates the tables) then `db:seed` (creates your admin
account plus three starter projects and one blog post). Both are safe to rerun —
migrations are tracked in a `_migrations` table, and every seed insert is
`ON CONFLICT DO NOTHING`, so **reseeding never overwrites content you edited in
the dashboard.**

### 6. Run

```bash
npm run dev
```

- Site: <http://localhost:3000>
- Admin: <http://localhost:3000/admin> (sign in with `SEED_ADMIN_EMAIL` /
  `SEED_ADMIN_PASSWORD`)

### 7. Make it yours

1. Edit **`src/content/site.ts`** — every `PLACEHOLDER` in that file is something
   only you can fill in: name, title, location, pitch, bio, skills, education,
   experience, and links. It is the only file with personal copy in it.
2. Save your CV as `public/resume.pdf`.
3. Replace the seeded projects and the "Hello, world" post from `/admin`.

---

## Environment variables

Set all of these in **`.env.local`** locally, and in **Vercel → your project →
Settings → Environment Variables** for production. Tick *Production*,
*Preview*, and *Development* unless noted.

| Variable | Required | What it is |
| --- | --- | --- |
| `DATABASE_URL` | **Yes** | Pooled Postgres connection string, including `?sslmode=require`. |
| `AUTH_SECRET` | **Yes** | ≥32 random chars; signs the session JWT. Changing it signs everyone out. |
| `NEXT_PUBLIC_SITE_URL` | **Yes in prod** | Canonical origin, no trailing slash, e.g. `https://yourname.com`. Used for canonical tags, `sitemap.xml`, and OG URLs. |
| `SEED_ADMIN_EMAIL` | Seed only | Admin login email created by `db:seed`. |
| `SEED_ADMIN_PASSWORD` | Seed only | Admin password, ≥10 chars. Only read by the seed script. |
| `SEED_ADMIN_NAME` | No | Display name in the dashboard header. |
| `RESEND_API_KEY` | No | From <https://resend.com/api-keys>. Without it, submissions still save — only the notification email is skipped. |
| `CONTACT_FROM_EMAIL` | No | Sender, e.g. `Portfolio <hello@yourdomain.com>`. Must be a Resend-verified domain; `onboarding@resend.dev` works for testing. |
| `CONTACT_TO_EMAIL` | No | Where notifications land — your inbox. |

The three `SEED_*` variables are only read by `scripts/seed.mjs`. You can set
them locally and never add them to Vercel, as long as you run the seed from your
machine against the production database.

---

## Deploying to Vercel

You need a Vercel account and this repo pushed to GitHub. Neither can be done on
your behalf.

### Option A — dashboard (no CLI)

1. Push this repo to GitHub (see [Pushing to GitHub](#pushing-to-github)).
2. Go to <https://vercel.com/new> and import the repository.
3. **Root Directory**: set it to `portfolio` if this folder is nested inside a
   larger repo. Framework preset is detected as Next.js; leave the build settings
   alone.
4. Add the environment variables from the table above **before** the first
   deploy, or the build will succeed and the pages will error at runtime.
5. Deploy. You get a URL like `https://your-project.vercel.app`.
6. Come back to Settings → Environment Variables and set
   `NEXT_PUBLIC_SITE_URL` to that URL, then redeploy once so canonical tags and
   the sitemap are right.

### Option B — CLI

```bash
npm i -g vercel
```

```bash
vercel login
```

```bash
vercel --cwd portfolio
```

Follow the prompts, then promote to production:

```bash
vercel --prod --cwd portfolio
```

Add env vars from the CLI if you prefer:

```bash
vercel env add DATABASE_URL production
```

### Migrate the production database

The migration scripts run from your machine against whatever `DATABASE_URL`
points at. If prod and local share one Neon database, step 5 above already did
it. If prod has its own database, point `.env.local` at it temporarily and run:

```bash
npm run db:setup
```

There is no migration step in the Vercel build, deliberately — a build that
mutates your schema is a build that can corrupt it on a rollback.

---

## Admin credentials

**There are no credentials yet.** Nothing has run, so no admin row exists. The
account is created the first time you run `npm run db:seed`, using whatever you
put in `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

Pick the password yourself and put it in `.env.local` before seeding. Use
something long and random:

```bash
node -e "console.log(require('crypto').randomBytes(12).toString('base64url'))"
```

### Changing the password later

From the command line:

```bash
npm run admin:hash -- "your new password" you@example.com
```

That hashes the password and writes it to that admin's row. Existing sessions
stay valid until they expire (7 days) — to kill them immediately, rotate
`AUTH_SECRET` in Vercel and redeploy.

Note that the password appears in your shell history. Clear it if that matters.

### Adding another admin

```bash
npm run admin:hash -- "their password"
```

Copy the printed hash and insert it:

```sql
INSERT INTO admins (email, password_hash, name)
VALUES ('them@example.com', '<paste hash>', 'Their Name');
```

There is no self-service signup, and no password-reset flow — for a one-person
site, a shell command is the right amount of machinery.

---

## API reference

All responses are JSON. Success is `{ "data": ... }`; failure is
`{ "error": "...", "fields"?: { ... } }`.

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/projects` | public | All projects, in display order |
| `POST` | `/api/projects` | admin | Create |
| `GET` | `/api/projects/{id}` | public | Single project |
| `PUT` | `/api/projects/{id}` | admin | Partial update — omitted fields are left alone |
| `DELETE` | `/api/projects/{id}` | admin | |
| `GET` | `/api/posts` | public | Published only; admins also see drafts |
| `POST` | `/api/posts` | admin | Create |
| `GET` | `/api/posts/{id}` | mixed | Drafts are 404 to anonymous callers |
| `PUT` | `/api/posts/{id}` | admin | Setting `published: true` stamps `published_at` once |
| `DELETE` | `/api/posts/{id}` | admin | |
| `POST` | `/api/contact` | public | Saves, then emails. Honeypot + 5-per-10-min per-IP cap |
| `GET` | `/api/contact` | admin | Newest 200 submissions |
| `PATCH` | `/api/contact/{id}` | admin | `{ "is_read": true }` |
| `DELETE` | `/api/contact/{id}` | admin | |
| `POST` | `/api/auth/login` | public | Sets the session cookie |
| `POST` | `/api/auth/logout` | public | Clears it |
| `GET` | `/api/auth/me` | admin | Current session, or 401 |

`PUT`/`DELETE` on the collection endpoints return `400` pointing you at the
`/{id}` form, rather than silently doing nothing.

Example:

```bash
curl -X POST http://localhost:3000/api/contact -H "Content-Type: application/json" -d '{"name":"Ada","email":"ada@example.com","message":"Hello there, this is a test message."}'
```

---

## Pushing to GitHub

This folder is already a git repo with an initial commit. Create an empty repo on
GitHub (**no** README, .gitignore, or licence), then:

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
```

```bash
git push -u origin main
```

---

## Custom domain

1. Buy the domain wherever you like (Namecheap, Cloudflare, Porkbun…).
2. Vercel → your project → **Settings → Domains → Add**, enter `yourname.com`.
3. Vercel shows the exact records. At your registrar's DNS panel:

   | Type | Name | Value |
   | --- | --- | --- |
   | `A` | `@` | `76.76.21.21` |
   | `CNAME` | `www` | `cname.vercel-dns.com` |

   Vercel is the source of truth for those values — use what its panel shows, not
   this table, if they differ.
4. Wait for propagation (minutes usually, up to 48h). HTTPS is issued
   automatically.
5. Update `NEXT_PUBLIC_SITE_URL` to `https://yourname.com` and redeploy, so
   canonical tags and `sitemap.xml` point at the real domain instead of
   `*.vercel.app`.
6. Optional: pick a redirect direction (`www` → apex or the reverse) in the same
   Domains panel so you do not split SEO across two hostnames.

If your DNS is on Cloudflare, set the records to **DNS only** (grey cloud), not
proxied — Vercel handles TLS itself and double-proxying causes redirect loops.

---

## SEO

Already wired up:

- Per-page `<title>` and meta descriptions via the Metadata API
- Canonical URLs on every page
- Open Graph + Twitter card tags, with a generated OG image at
  `/opengraph-image` (no static PNG to keep in sync)
- `sitemap.xml`, including every published post
- `robots.txt`, with `/admin` and `/api` disallowed
- JSON-LD: `Person` sitewide, `BlogPosting` per post
- Semantic landmarks (`header`/`nav`/`main`/`footer`/`article`), a skip link,
  labelled form fields, and visible focus rings
- `prefers-reduced-motion` honoured for both scroll behaviour and animations

To hit Lighthouse 90+ you still need to:

1. Fill in real content — placeholder text hurts nothing technically, but an
   empty projects list means an almost-empty page.
2. Add `src/app/icon.png` (512×512) so the favicon check passes.
3. Serve reasonably sized thumbnails. `next/image` optimises them, but a 4 MB
   source PNG is still a 4 MB fetch on the first request.

---

## Design notes

Theme tokens are CSS custom properties in `globals.css`, mapped to Tailwind
colour names (`bg`, `surface`, `card`, `fg`, `muted`, `line`, `accent`) in
`tailwind.config.ts`. One set of utility classes therefore works in both themes,
and changing the accent colour means editing two lines — the `--accent` value
under `:root` and under `.dark`. Dark uses a lighter blue so contrast holds.

Dark is the default. A tiny inline script in `layout.tsx` applies the stored
preference before first paint, so there is no flash of the wrong theme; only an
explicit `theme=light` in `localStorage` opts out.

---

## Rendering strategy

Every database-backed page is `export const dynamic = "force-dynamic"`. That
means:

- The build never needs `DATABASE_URL`, so a missing env var cannot break a
  deploy.
- Edits in `/admin` appear immediately.
- Every visit costs a database round trip.

Once your content settles, switching a page to incremental static regeneration is
a one-line change — replace the `dynamic` export with:

```ts
export const revalidate = 60
```

Do that for `page.tsx`, `projects/page.tsx`, `blog/page.tsx`, and
`blog/[slug]/page.tsx` and the site serves mostly from cache, at the cost of up
to a minute's delay after an edit. Keep `force-dynamic` on `/admin` and the API
routes regardless.

---

## Security notes

- Passwords are bcrypt, cost 12. Plaintext is never stored or logged.
- The session cookie is `httpOnly`, `sameSite=lax`, and `secure` in production.
  The JWT is signed, not encrypted — it carries only id, email, and name.
- Login returns the same message for an unknown email and a wrong password, and
  runs a bcrypt comparison either way so timing does not leak which emails exist.
- `middleware.ts` gates `/admin/**`, and every write route independently calls
  `requireAdmin()`. Middleware alone is not an authorisation model.
- All SQL is parameterised. `updateProject`/`updatePost` build their `SET` lists
  from a hardcoded column allowlist, so a rogue key in the request body cannot
  reach the query.
- `?next=` on the login page only accepts same-site relative paths, so it cannot
  be used as an open redirect.
- Contact form: hidden honeypot field, plus a 5-per-10-minutes-per-IP cap counted
  in Postgres so it holds across serverless instances.
- **Blog bodies are rendered as trusted HTML.** Markdown goes through `marked`
  without sanitising, because the only author is you. If you ever let someone
  else write posts, add a sanitiser in `blog/[slug]/page.tsx`.

---

## Known unknowns

Because this has never been built, these are the places to look first if
something breaks:

1. **`npm install` resolution.** Versions were pinned by hand. If React 19 and
   Next 15.1.6 disagree with a transitive peer, `npm install` will say so.
2. **`npm run build`.** The most likely failures are a TypeScript strict-mode
   complaint or a Tailwind `@apply` in `globals.css` referring to a class that
   does not resolve. Run `npm run typecheck` first for a faster signal.
3. **`next/font` at build time** needs outbound network access to fetch Inter and
   Space Grotesk. Fine on Vercel; a problem behind a strict corporate proxy.
4. **`opengraph-image.tsx`** runs on the Edge runtime. If it fails to build,
   delete the file — you lose the generated OG card, nothing else.
5. **`marked` v15 API.** Called as `marked.parse(body, { async: false })`. If the
   installed version returns a Promise instead of a string, that is why the post
   body renders as `[object Promise]`.
6. **Connection limits.** If you see "too many connections", `DATABASE_URL` is
   pointing at the direct endpoint rather than the pooled one.

None of these are design problems; they are the ordinary first-build shakeout
that would normally have been done before handing this over.

---

## Licence

Private. Do as you like with it.
