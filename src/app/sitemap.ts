import type { MetadataRoute } from "next";
import { site, siteUrl } from "@/content/site";
import { listPublishedPosts } from "@/lib/queries";

/**
 * Served at /sitemap.xml. Static pages are always listed; blog posts are pulled
 * from the database. If that query fails the sitemap still returns the static
 * pages rather than erroring, because a broken sitemap is worse than a partial one.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.8 },
    { url: `${base}/projects`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
  ];

  if (!site.blogEnabled) return staticPages;

  staticPages.push({
    url: `${base}/blog`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  });

  try {
    const posts = await listPublishedPosts();
    return [
      ...staticPages,
      ...posts.map((post) => ({
        url: `${base}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at),
        changeFrequency: "yearly" as const,
        priority: 0.7,
      })),
    ];
  } catch (err) {
    console.error("[sitemap] could not list posts:", err);
    return staticPages;
  }
}
