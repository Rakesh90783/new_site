"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Project } from "@/lib/types";
import { slugify } from "@/lib/slug";
import { apiRequest, RequestFailed } from "./api-client";

type Mode = { kind: "list" } | { kind: "new" } | { kind: "edit"; project: Project };

const EMPTY = {
  title: "",
  slug: "",
  description: "",
  tech: "",
  demo_url: "",
  repo_url: "",
  thumbnail_url: "",
  featured: false,
  sort_order: 0,
};

type FormState = typeof EMPTY;

function toFormState(project: Project): FormState {
  return {
    title: project.title,
    slug: project.slug,
    description: project.description,
    tech: project.tech.join(", "),
    demo_url: project.demo_url ?? "",
    repo_url: project.repo_url ?? "",
    thumbnail_url: project.thumbnail_url ?? "",
    featured: project.featured,
    sort_order: project.sort_order,
  };
}

export function ProjectEditor({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function startNew() {
    setForm(EMPTY);
    setError(null);
    setMode({ kind: "new" });
  }

  function startEdit(project: Project) {
    setForm(toFormState(project));
    setError(null);
    setMode({ kind: "edit", project });
  }

  function cancel() {
    setError(null);
    setMode({ kind: "list" });
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    // Empty strings become null so the API's optional-URL rule accepts them.
    const body = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      description: form.description,
      tech: form.tech,
      demo_url: form.demo_url || null,
      repo_url: form.repo_url || null,
      thumbnail_url: form.thumbnail_url || null,
      featured: form.featured,
      sort_order: Number(form.sort_order) || 0,
    };

    try {
      if (mode.kind === "edit") {
        await apiRequest(`/api/projects/${mode.project.id}`, { method: "PUT", body });
      } else {
        await apiRequest("/api/projects", { method: "POST", body });
      }
      setMode({ kind: "list" });
      router.refresh();
    } catch (err) {
      setError(err instanceof RequestFailed ? err.message : "Could not save the project.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(project: Project) {
    if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) return;

    setDeletingId(project.id);
    setError(null);
    try {
      await apiRequest(`/api/projects/${project.id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setError(err instanceof RequestFailed ? err.message : "Could not delete the project.");
    } finally {
      setDeletingId(null);
    }
  }

  // ------------------------------------------------------------------- form
  if (mode.kind !== "list") {
    return (
      <form onSubmit={save} className="card max-w-2xl space-y-5 p-6">
        <h2 className="font-display text-lg font-semibold">
          {mode.kind === "edit" ? `Edit “${mode.project.title}”` : "New project"}
        </h2>

        <div>
          <label htmlFor="p-title" className="label">
            Title
          </label>
          <input
            id="p-title"
            required
            maxLength={160}
            value={form.title}
            onChange={(e) => {
              set("title", e.target.value);
              // Keep the slug in step with the title until the user edits it by hand.
              if (mode.kind === "new") set("slug", slugify(e.target.value));
            }}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="p-slug" className="label">
            Slug
          </label>
          <input
            id="p-slug"
            required
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            className="input font-mono text-xs"
            placeholder="my-project"
          />
          <p className="mt-1 text-xs text-muted">
            Lowercase letters, numbers, and single hyphens. Must be unique.
          </p>
        </div>

        <div>
          <label htmlFor="p-description" className="label">
            Description
          </label>
          <textarea
            id="p-description"
            required
            rows={4}
            maxLength={2000}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="input resize-y"
          />
        </div>

        <div>
          <label htmlFor="p-tech" className="label">
            Tech tags
          </label>
          <input
            id="p-tech"
            value={form.tech}
            onChange={(e) => set("tech", e.target.value)}
            className="input"
            placeholder="TypeScript, Postgres, Docker"
          />
          <p className="mt-1 text-xs text-muted">Comma-separated. Up to 20 tags.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="p-demo" className="label">
              Live demo URL
            </label>
            <input
              id="p-demo"
              type="url"
              value={form.demo_url}
              onChange={(e) => set("demo_url", e.target.value)}
              className="input"
              placeholder="https://…"
            />
          </div>
          <div>
            <label htmlFor="p-repo" className="label">
              Repository URL
            </label>
            <input
              id="p-repo"
              type="url"
              value={form.repo_url}
              onChange={(e) => set("repo_url", e.target.value)}
              className="input"
              placeholder="https://github.com/…"
            />
          </div>
        </div>

        <div>
          <label htmlFor="p-thumb" className="label">
            Thumbnail URL
          </label>
          <input
            id="p-thumb"
            type="url"
            value={form.thumbnail_url}
            onChange={(e) => set("thumbnail_url", e.target.value)}
            className="input"
            placeholder="https://…/screenshot.png"
          />
          <p className="mt-1 text-xs text-muted">
            Leave blank to show a generated initials tile instead.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label htmlFor="p-order" className="label">
              Sort order
            </label>
            <input
              id="p-order"
              type="number"
              min={0}
              max={9999}
              value={form.sort_order}
              onChange={(e) => set("sort_order", Number(e.target.value))}
              className="input w-28"
            />
            <p className="mt-1 text-xs text-muted">Lower shows first.</p>
          </div>

          <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set("featured", e.target.checked)}
              className="h-4 w-4 rounded border-line accent-accent"
            />
            Feature on the home page
          </label>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-500"
          >
            {error}
          </p>
        )}

        <div className="flex gap-3 border-t border-line pt-5">
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Saving…" : mode.kind === "edit" ? "Save changes" : "Create project"}
          </button>
          <button type="button" onClick={cancel} disabled={busy} className="btn-ghost">
            Cancel
          </button>
        </div>
      </form>
    );
  }

  // ------------------------------------------------------------------- list
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {projects.length} project{projects.length === 1 ? "" : "s"}
        </p>
        <button type="button" onClick={startNew} className="btn-primary !py-2">
          New project
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-500"
        >
          {error}
        </p>
      )}

      {projects.length === 0 ? (
        <p className="card mt-6 p-8 text-center text-sm text-muted">
          No projects yet. Create your first one.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {projects.map((project) => (
            <li key={project.id} className="card flex flex-wrap items-start gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-fg">{project.title}</h3>
                  {project.featured && (
                    <span className="rounded bg-accent/15 px-1.5 py-0.5 text-xs font-medium text-accent">
                      featured
                    </span>
                  )}
                  <span className="font-mono text-xs text-muted">#{project.sort_order}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{project.description}</p>
                <p className="mt-1 font-mono text-xs text-muted/70">/{project.slug}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(project)}
                  className="btn-secondary !px-3 !py-1.5 !text-xs"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(project)}
                  disabled={deletingId === project.id}
                  className="btn-danger !px-3 !py-1.5 !text-xs"
                >
                  {deletingId === project.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
