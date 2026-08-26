import type { Metadata } from "next";
import { site } from "@/content/site";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${site.name}.`,
  alternates: { canonical: "/contact" },
};

function directLinks() {
  return [
    {
      label: "Email",
      value: site.links.email,
      href: site.links.email ? `mailto:${site.links.email}` : "",
    },
    { label: "GitHub", value: site.links.github, href: site.links.github },
    { label: "LinkedIn", value: site.links.linkedin, href: site.links.linkedin },
  ].filter((l) => l.href);
}

/** Strips the protocol so a long URL reads cleanly in the sidebar. */
function displayValue(value: string): string {
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export default function ContactPage() {
  const links = directLinks();

  return (
    <div className="container-page py-16 sm:py-24">
      <header className="max-w-2xl">
        <p className="eyebrow animate-fade-up">Contact</p>
        <h1
          className="mt-3 animate-fade-up font-display text-4xl font-bold tracking-tight sm:text-5xl"
          style={{ animationDelay: "60ms" }}
        >
          Let&apos;s talk
        </h1>
        <p
          className="mt-4 animate-fade-up text-lg leading-relaxed text-muted"
          style={{ animationDelay: "120ms" }}
        >
          Fill in the form and it lands in my inbox. I usually reply within a day or two.
        </p>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="animate-fade-up" style={{ animationDelay: "180ms" }}>
          <ContactForm />
        </div>

        <aside className="animate-fade-up space-y-8" style={{ animationDelay: "240ms" }}>
          {links.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Or reach me directly
              </h2>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      <span className="block text-xs uppercase tracking-wider text-muted">
                        {link.label}
                      </span>
                      <span className="break-all text-sm text-fg group-hover:text-accent">
                        {displayValue(link.value)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-fg">Based in</h2>
            <p className="mt-1 text-sm text-muted">{site.location}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
