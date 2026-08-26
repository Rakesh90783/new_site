import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { site, siteUrl } from "@/content/site";
import { getPublishedPostBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

/**
 * Post bodies are Markdown, authored only by a signed-in admin. That is the
 * trust boundary: `marked` output is not sanitised, so raw HTML in a post body
 * renders as HTML. Fine for your own writing — if you ever open authoring to
 * other people, add a sanitiser here.
 */
function renderMarkdown(body: string): string {
  return marked.parse(body, { async: false, gfm: true, breaks: false }) as string;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug).catch(() => null);

  if (!post) return { title: "Post not found" };

  const description = post.excerpt ?? `${post.title} — a post by ${site.name}.`;

  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: `${siteUrl()}/blog/${post.slug}`,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      tags: [...post.tags],
      ...(post.cover_url ? { images: [{ url: post.cover_url }] } : {}),
    },
    twitter: {
      card: post.cover_url ? "summary_large_image" : "summary",
      title: post.title,
      description,
    },
  };
}

export default async function PostPage({ params }: Props) {
  if (!site.blogEnabled) notFound();

  const { slug } = await params;

  let post;
  try {
    post = await getPublishedPostBySlug(slug);
  } catch (err) {
    // A database outage is not the same as a missing post, but from the
    // visitor's point of view the page is unavailable either way.
    console.error("[post] load failed:", err);
    notFound();
  }

  if (!post) notFound();

  const published = post.published_at ?? post.created_at;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: published,
    dateModified: post.updated_at,
    author: { "@type": "Person", name: site.name, url: siteUrl() },
    mainEntityOfPage: `${siteUrl()}/blog/${post.slug}`,
    ...(post.cover_url ? { image: post.cover_url } : {}),
  };

  return (
    <article className="container-page py-16 sm:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-sm text-muted transition-colors hover:text-accent">
          ← All posts
        </Link>

        <header className="mt-6">
          <time
            dateTime={published}
            className="text-sm font-medium uppercase tracking-wider text-accent"
          >
            {new Date(published).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {post.title}
          </h1>
          {post.excerpt && <p className="mt-4 text-lg leading-relaxed text-muted">{post.excerpt}</p>}
          {post.tags.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <li key={tag} className="tag">
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </header>

        {post.cover_url && (
          <Image
            src={post.cover_url}
            alt=""
            width={1200}
            height={630}
            priority
            className="mt-10 w-full rounded-xl border border-line object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        )}

        <div
          className="prose-post mt-10"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
        />

        <footer className="mt-16 border-t border-line pt-8">
          <p className="text-sm text-muted">
            Written by <span className="font-medium text-fg">{site.name}</span>.{" "}
            <Link href="/contact" className="link-underline">
              Get in touch
            </Link>{" "}
            if you have thoughts.
          </p>
        </footer>
      </div>
    </article>
  );
}
