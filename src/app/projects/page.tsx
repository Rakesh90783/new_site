import type { Metadata } from "next";
import { site } from "@/content/site";
import { listProjects } from "@/lib/queries";
import type { Project } from "@/lib/types";
import { ProjectCard } from "@/components/project-card";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects",
  description: `Selected projects by ${site.name} — ${site.title}.`,
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  let projects: Project[] = [];
  let failed = false;
  try {
    projects = await listProjects();
  } catch (err) {
    console.error("[projects] load failed:", err);
    failed = true;
  }

  return (
    <div className="container-page py-16 sm:py-24">
      <header className="max-w-2xl">
        <p className="eyebrow animate-fade-up">Projects</p>
        <h1
          className="mt-3 animate-fade-up font-display text-4xl font-bold tracking-tight sm:text-5xl"
          style={{ animationDelay: "60ms" }}
        >
          Everything I&apos;ve shipped
        </h1>
        <p
          className="mt-4 animate-fade-up text-lg leading-relaxed text-muted"
          style={{ animationDelay: "120ms" }}
        >
          Production systems, side projects, and the occasional weekend experiment. Each one links
          to a live demo or the source where available.
        </p>
      </header>

      {projects.length > 0 ? (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <Reveal key={project.id} delay={i * 60} className="h-full">
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="card mt-12 p-10 text-center">
          <p className="text-sm text-muted">
            {failed
              ? "Projects could not be loaded right now — the database was unreachable. Please try again shortly."
              : "No projects have been added yet. Sign in at /admin to add the first one."}
          </p>
        </div>
      )}
    </div>
  );
}
