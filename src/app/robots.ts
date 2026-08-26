import type { MetadataRoute } from "next";
import { siteUrl } from "@/content/site";

/** Served at /robots.txt. */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // No value in indexing the dashboard or the JSON API.
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
