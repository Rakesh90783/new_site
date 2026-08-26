import Image from "next/image";
import type { Project } from "@/lib/types";

/** External-link icon, shared by the demo and repo links. */
function ArrowIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M7 17L17 7M17 7H8M17 7v9" />
    </svg>
  );
}

/**
 * Falls back to the project's initials when no thumbnail_url is set, so a card
 * without an image still looks deliberate rather than broken.
 */
function Thumbnail({ project }: { project: Project }) {
  if (project.thumbnail_url) {
    return (
      <Image
        src={project.thumbnail_url}
        alt={`Screenshot of ${project.title}`}
        width={800}
        height={450}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    );
  }

  const initials = project.title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="flex h-full w-full items-center justify-center bg-gradient-to-br
                 from-accent/20 via-surface to-surface"
      aria-hidden="true"
    >
      <span className="font-display text-3xl font-bold text-accent/70">{initials}</span>
    </div>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="card group flex h-full flex-col overflow-hidden transition-colors hover:border-accent/50">
      <div className="aspect-[16/9] w-full overflow-hidden border-b border-line bg-surface">
        <Thumbnail project={project} />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold leading-snug text-fg">
          {project.title}
        </h3>

        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{project.description}</p>

        {project.tech.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies used">
            {project.tech.map((t) => (
              <li key={t} className="tag">
                {t}
              </li>
            ))}
          </ul>
        )}

        {(project.demo_url || project.repo_url) && (
          <div className="mt-5 flex flex-wrap gap-4 border-t border-line pt-4">
            {project.demo_url && (
              <a
                href={project.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
              >
                Live demo <ArrowIcon />
              </a>
            )}
            {project.repo_url && (
              <a
                href={project.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-accent"
              >
                Source <ArrowIcon />
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
