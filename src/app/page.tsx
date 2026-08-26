import Link from "next/link";
import { site } from "@/content/site";
import { listFeaturedProjects, listPublishedPosts } from "@/lib/queries";
import { ProjectCard } from "@/components/project-card";
import { Reveal } from "@/components/reveal";

/**
 * Rendered per request so newly published projects and posts appear immediately
 * and the build never needs database access. Switch to
 *   export const revalidate = 60
 * once you are happy for edits to take up to a minute to show up — see README.
 */
export const dynamic = "force-dynamic";

/** The DB is optional for the page to render; an outage degrades, not 500s. */
async function loadContent() {
  try {
    const [projects, posts] = await Promise.all([
      listFeaturedProjects(3),
      site.blogEnabled ? listPublishedPosts() : Promise.resolve([]),
    ]);
    return { projects, posts: posts.slice(0, 2), failed: false };
  } catch (err) {
    console.error("[home] content load failed:", err);
    return { projects: [], posts: [], failed: true };
  }
}

export default async function HomePage() {
  const { projects, posts, failed } = await loadContent();

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden border-b border-line">
        {/* Decorative accent glow. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[52rem]
                     -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
        />
        <div className="container-page relative py-24 sm:py-32">
          <div className="max-w-3xl">
            <p className="eyebrow animate-fade-up">{site.location}</p>

            <h1
              className="mt-4 animate-fade-up font-display text-4xl font-bold leading-[1.08]
                         tracking-tight text-fg sm:text-6xl"
              style={{ animationDelay: "60ms" }}
            >
              {site.name}
            </h1>

            <p
              className="mt-3 animate-fade-up font-display text-xl text-accent sm:text-2xl"
              style={{ animationDelay: "120ms" }}
            >
              {site.title}
            </p>

            <p
              className="mt-6 max-w-2xl animate-fade-up text-lg leading-relaxed text-muted"
              style={{ animationDelay: "180ms" }}
            >
              {site.pitch}
            </p>

            <div
              className="mt-9 flex animate-fade-up flex-col gap-3 sm:flex-row"
              style={{ animationDelay: "240ms" }}
            >
              <Link href="/projects" className="btn-primary">
                View work
              </Link>
              <Link href="/contact" className="btn-secondary">
                Contact me
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ projects */}
      <section className="container-page py-20 sm:py-24">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Selected work</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Things I&apos;ve built
              </h2>
            </div>
            <Link
              href="/projects"
              className="text-sm font-medium text-accent hover:underline"
            >
              All projects →
            </Link>
          </div>
        </Reveal>

        {projects.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, i) => (
              <Reveal key={project.id} delay={i * 80} className="h-full">
                <ProjectCard project={project} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="card mt-10 p-8 text-center text-sm text-muted">
            {failed
              ? "Projects are temporarily unavailable — the database could not be reached."
              : "No projects yet. Add your first one from the admin dashboard."}
          </p>
        )}
      </section>

      {/* -------------------------------------------------------------- skills */}
      <section className="border-y border-line bg-surface/50">
        <div className="container-page py-20 sm:py-24">
          <Reveal>
            <p className="eyebrow">Toolkit</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              What I work with
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {site.skills.map((group, i) => (
              <Reveal key={group.group} delay={i * 70}>
                <h3 className="text-sm font-semibold text-fg">{group.group}</h3>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <li key={item} className="tag">
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- blog */}
      {site.blogEnabled && posts.length > 0 && (
        <section className="container-page py-20 sm:py-24">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Writing</p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  From the blog
                </h2>
              </div>
              <Link href="/blog" className="text-sm font-medium text-accent hover:underline">
                All posts →
              </Link>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {posts.map((post, i) => (
              <Reveal key={post.id} delay={i * 80}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="card block h-full p-6 transition-colors hover:border-accent/50"
                >
                  <time
                    dateTime={post.published_at ?? post.created_at}
                    className="text-xs font-medium uppercase tracking-wider text-muted"
                  >
                    {new Date(post.published_at ?? post.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                  <h3 className="mt-2 font-display text-lg font-semibold text-fg">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 text-sm leading-relaxed text-muted">{post.excerpt}</p>
                  )}
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ final CTA */}
      <section className="border-t border-line bg-surface/50">
        <div className="container-page py-20 text-center sm:py-24">
          <Reveal>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Have something in mind?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">
              I&apos;m open to interesting problems, contract work, and the occasional long
              conversation about data pipelines.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/contact" className="btn-primary">
                Start a conversation
              </Link>
              {site.resumeUrl && (
                <a href={site.resumeUrl} download className="btn-secondary">
                  Download resume
                </a>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
