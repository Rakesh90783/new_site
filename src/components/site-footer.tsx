import Link from "next/link";
import { navLinks, site } from "@/content/site";

/** Social links, filtered so an empty value in site.ts simply disappears. */
function socialLinks() {
  return [
    { label: "GitHub", href: site.links.github },
    { label: "LinkedIn", href: site.links.linkedin },
    { label: "X", href: site.links.twitter },
    { label: "Email", href: site.links.email ? `mailto:${site.links.email}` : "" },
  ].filter((l) => l.href);
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  const range = year > site.startYear ? `${site.startYear}–${year}` : `${year}`;
  const socials = socialLinks();

  return (
    <footer className="border-t border-line bg-surface/50">
      <div className="container-page flex flex-col gap-8 py-12 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <p className="font-display text-base font-semibold text-fg">{site.name}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{site.pitch}</p>
        </div>

        <div className="flex gap-12">
          <nav aria-label="Footer" className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Pages</p>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted transition-colors hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {socials.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Elsewhere</p>
              {socials.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target={l.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className="text-sm text-muted transition-colors hover:text-accent"
                >
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container-page flex flex-col gap-2 border-t border-line py-6 text-xs text-muted sm:flex-row sm:justify-between">
        <p>
          © {range} {site.name}. All rights reserved.
        </p>
        <p>
          Built with Next.js, Tailwind CSS, and Postgres.{" "}
          <Link href="/admin" className="hover:text-accent">
            Admin
          </Link>
        </p>
      </div>
    </footer>
  );
}
