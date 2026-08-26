import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "About",
  description: `About ${site.name} — ${site.title} based in ${site.location}.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="container-page py-16 sm:py-24">
      {/* ------------------------------------------------------------- intro */}
      <header className="max-w-3xl">
        <p className="eyebrow animate-fade-up">About</p>
        <h1
          className="mt-3 animate-fade-up font-display text-4xl font-bold tracking-tight sm:text-5xl"
          style={{ animationDelay: "60ms" }}
        >
          {site.title} in {site.location}
        </h1>
        <div
          className="mt-6 animate-fade-up space-y-4 text-lg leading-relaxed text-muted"
          style={{ animationDelay: "120ms" }}
        >
          {site.bio.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>

        {site.resumeUrl && (
          <div
            className="mt-8 flex animate-fade-up flex-col gap-3 sm:flex-row"
            style={{ animationDelay: "180ms" }}
          >
            <a href={site.resumeUrl} download className="btn-primary">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 3v12M7 11l5 5 5-5M5 21h14" />
              </svg>
              Download resume
            </a>
            <Link href="/contact" className="btn-secondary">
              Get in touch
            </Link>
          </div>
        )}
      </header>

      {/* ------------------------------------------------------------ skills */}
      <section className="mt-20" aria-labelledby="skills-heading">
        <Reveal>
          <h2 id="skills-heading" className="font-display text-2xl font-bold tracking-tight">
            Skills
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {site.skills.map((group, i) => (
            <Reveal key={group.group} delay={i * 70}>
              <div className="card h-full p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-accent">
                  {group.group}
                </h3>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <li key={item} className="tag">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- experience */}
      {site.experience.length > 0 && (
        <section className="mt-20" aria-labelledby="experience-heading">
          <Reveal>
            <h2 id="experience-heading" className="font-display text-2xl font-bold tracking-tight">
              Experience
            </h2>
          </Reveal>
          <ol className="mt-8 space-y-6">
            {site.experience.map((job, i) => (
              <Reveal key={`${job.company}-${job.period}`} delay={i * 70}>
                <li className="card p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-display text-lg font-semibold text-fg">{job.role}</h3>
                    <p className="text-sm text-muted">{job.period}</p>
                  </div>
                  <p className="mt-1 text-sm font-medium text-accent">{job.company}</p>
                  {job.summary && (
                    <p className="mt-3 text-sm leading-relaxed text-muted">{job.summary}</p>
                  )}
                </li>
              </Reveal>
            ))}
          </ol>
        </section>
      )}

      {/* --------------------------------------------------------- education */}
      {site.education.length > 0 && (
        <section className="mt-20" aria-labelledby="education-heading">
          <Reveal>
            <h2 id="education-heading" className="font-display text-2xl font-bold tracking-tight">
              Education
            </h2>
          </Reveal>
          <ol className="mt-8 space-y-6">
            {site.education.map((entry, i) => (
              <Reveal key={`${entry.institution}-${entry.period}`} delay={i * 70}>
                <li className="card p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-display text-lg font-semibold text-fg">
                      {entry.qualification}
                    </h3>
                    <p className="text-sm text-muted">{entry.period}</p>
                  </div>
                  <p className="mt-1 text-sm font-medium text-accent">{entry.institution}</p>
                  {entry.note && (
                    <p className="mt-3 text-sm leading-relaxed text-muted">{entry.note}</p>
                  )}
                </li>
              </Reveal>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
