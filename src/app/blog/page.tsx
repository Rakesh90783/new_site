import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/content/site";
import { listPublishedPosts } from "@/lib/queries";
import type { Post } from "@/lib/types";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: `Notes and write-ups by ${site.name}.`,
  alternates: { canonical: "/blog" },
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPage() {
  // Turning the blog off in site.ts removes the route as well as the nav link.
  if (!site.blogEnabled) notFound();

  let posts: Post[] = [];
  let failed = false;
  try {
    posts = await listPublishedPosts();
  } catch (err) {
    console.error("[blog] load failed:", err);
    failed = true;
  }

  return (
    <div className="container-page py-16 sm:py-24">
      <header className="max-w-2xl">
        <p className="eyebrow animate-fade-up">Blog</p>
        <h1
          className="mt-3 animate-fade-up font-display text-4xl font-bold tracking-tight sm:text-5xl"
          style={{ animationDelay: "60ms" }}
        >
          Writing
        </h1>
        <p
          className="mt-4 animate-fade-up text-lg leading-relaxed text-muted"
          style={{ animationDelay: "120ms" }}
        >
          Notes on data engineering, automation, and things I learned the hard way.
        </p>
      </header>

      {posts.length > 0 ? (
        <ul className="mt-12 divide-y divide-line border-y border-line">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={Math.min(i, 6) * 50}>
              <li>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col gap-2 py-7 transition-colors sm:flex-row sm:items-baseline sm:gap-8"
                >
                  <time
                    dateTime={post.published_at ?? post.created_at}
                    className="shrink-0 text-sm text-muted sm:w-36"
                  >
                    {formatDate(post.published_at ?? post.created_at)}
                  </time>
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-semibold text-fg group-hover:text-accent">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-2 text-sm leading-relaxed text-muted">{post.excerpt}</p>
                    )}
                    {post.tags.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {post.tags.map((tag) => (
                          <li key={tag} className="tag">
                            {tag}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Link>
              </li>
            </Reveal>
          ))}
        </ul>
      ) : (
        <div className="card mt-12 p-10 text-center">
          <p className="text-sm text-muted">
            {failed
              ? "Posts could not be loaded right now — the database was unreachable."
              : "No published posts yet. Write your first one from the admin dashboard."}
          </p>
        </div>
      )}
    </div>
  );
}
