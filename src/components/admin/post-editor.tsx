"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Post } from "@/lib/types";
import { slugify } from "@/lib/slug";
import { apiRequest, RequestFailed } from "./api-client";

type Mode = { kind: "list" } | { kind: "new" } | { kind: "edit"; post: Post };

const EMPTY = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  cover_url: "",
  tags: "",
  published: false,
};

type FormState = typeof EMPTY;

function toFormState(post: Post): FormState {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    body: post.body,
    cover_url: post.cover_url ?? "",
    tags: post.tags.join(", "),
    published: post.published,
  };
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PostEditor({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const body = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      excerpt: form.excerpt || null,
      body: form.body,
      cover_url: form.cover_url || null,
      tags: form.tags,
      published: form.published,
    };

    try {
      if (mode.kind === "edit") {
        await apiRequest(`/api/posts/${mode.post.id}`, { method: "PUT", body });
      } else {
        await apiRequest("/api/posts", { method: "POST", body });
      }
      setMode({ kind: "list" });
      router.refresh();
    } catch (err) {
      setError(err instanceof RequestFailed ? err.message : "Could not save the post.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(post: Post) {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;

    setDeletingId(post.id);
    setError(null);
    try {
      await apiRequest(`/api/posts/${post.id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setError(err instanceof RequestFailed ? err.message : "Could not delete the post.");
    } finally {
      setDeletingId(null);
    }
  }

  /** Publish/unpublish without opening the editor. */
  async function togglePublished(post: Post) {
    setError(null);
    try {
      await apiRequest(`/api/posts/${post.id}`, {
        method: "PUT",
        body: { published: !post.published },
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof RequestFailed ? err.message : "Could not update the post.");
    }
  }

  // ------------------------------------------------------------------- form
  if (mode.kind !== "list") {
    return (
      <form onSubmit={save} className="card max-w-3xl space-y-5 p-6">
        <h2 className="font-display text-lg font-semibold">
          {mode.kind === "edit" ? `Edit “${mode.post.title}”` : "New post"}
        </h2>

        <div>
          <label htmlFor="b-title" className="label">
            Title
          </label>
          <input
            id="b-title"
            required
            maxLength={200}
            value={form.title}
            onChange={(e) => {
              set("title", e.target.value);
              if (mode.kind === "new") set("slug", slugify(e.target.value));
            }}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="b-slug" className="label">
            Slug
          </label>
          <input
            id="b-slug"
            required
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            className="input font-mono text-xs"
          />
          <p className="mt-1 text-xs text-muted">The post will live at /blog/{form.slug || "…"}</p>
        </div>

        <div>
          <label htmlFor="b-excerpt" className="label">
            Excerpt
          </label>
          <textarea
            id="b-excerpt"
            rows={2}
            maxLength={400}
            value={form.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            className="input resize-y"
          />
          <p className="mt-1 text-xs text-muted">
            Shown in the post list and used as the meta description.
          </p>
        </div>

        <div>
          <label htmlFor="b-body" className="label">
            Body (Markdown)
          </label>
          <textarea
            id="b-body"
            required
            rows={18}
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            className="input resize-y font-mono text-sm"
            placeholder={"## A heading\n\nA paragraph with **bold** and `code`.\n\n- a list item"}
          />
          <p className="mt-1 text-xs text-muted">
            Headings, lists, links, bold, and fenced code blocks are supported.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="b-cover" className="label">
              Cover image URL
            </label>
            <input
              id="b-cover"
              type="url"
              value={form.cover_url}
              onChange={(e) => set("cover_url", e.target.value)}
              className="input"
              placeholder="https://…"
            />
          </div>
          <div>
            <label htmlFor="b-tags" className="label">
              Tags
            </label>
            <input
              id="b-tags"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              className="input"
              placeholder="postgres, etl"
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => set("published", e.target.checked)}
            className="h-4 w-4 rounded border-line accent-accent"
          />
          Published (visible on the public blog)
        </label>

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
            {busy ? "Saving…" : mode.kind === "edit" ? "Save changes" : "Create post"}
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode({ kind: "list" });
            }}
            disabled={busy}
            className="btn-ghost"
          >
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
          {posts.length} post{posts.length === 1 ? "" : "s"} ·{" "}
          {posts.filter((p) => p.published).length} published
        </p>
        <button
          type="button"
          onClick={() => {
            setForm(EMPTY);
            setError(null);
            setMode({ kind: "new" });
          }}
          className="btn-primary !py-2"
        >
          New post
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

      {posts.length === 0 ? (
        <p className="card mt-6 p-8 text-center text-sm text-muted">
          No posts yet. Write your first one.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {posts.map((post) => (
            <li key={post.id} className="card flex flex-wrap items-start gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-fg">{post.title}</h3>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                      post.published
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-surface text-muted"
                    }`}
                  >
                    {post.published ? "published" : "draft"}
                  </span>
                </div>
                {post.excerpt && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{post.excerpt}</p>
                )}
                <p className="mt-1 font-mono text-xs text-muted/70">
                  /blog/{post.slug} · {formatDate(post.published_at ?? post.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => togglePublished(post)}
                  className="btn-ghost !px-3 !py-1.5 !text-xs"
                >
                  {post.published ? "Unpublish" : "Publish"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm(toFormState(post));
                    setError(null);
                    setMode({ kind: "edit", post });
                  }}
                  className="btn-secondary !px-3 !py-1.5 !text-xs"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(post)}
                  disabled={deletingId === post.id}
                  className="btn-danger !px-3 !py-1.5 !text-xs"
                >
                  {deletingId === post.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
