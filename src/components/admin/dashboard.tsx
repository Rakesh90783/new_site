"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ContactMessage, Post, Project } from "@/lib/types";
import { apiRequest } from "./api-client";
import { ProjectEditor } from "./project-editor";
import { PostEditor } from "./post-editor";
import { MessageList } from "./message-list";

type Tab = "projects" | "posts" | "messages";

export function Dashboard({
  user,
  projects,
  posts,
  messages,
}: {
  user: { email: string; name: string | null };
  projects: Project[];
  posts: Post[];
  messages: ContactMessage[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("projects");
  const [signingOut, setSigningOut] = useState(false);

  const unread = messages.filter((m) => !m.is_read).length;

  async function signOut() {
    setSigningOut(true);
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {
      // Even if the request fails, sending them to the login page is the right
      // outcome — the cookie is httpOnly so we cannot clear it from here.
    }
    router.replace("/admin/login");
    router.refresh();
  }

  const tabs: { id: Tab; label: string; count: number; badge?: number }[] = [
    { id: "projects", label: "Projects", count: projects.length },
    { id: "posts", label: "Posts", count: posts.length },
    { id: "messages", label: "Messages", count: messages.length, badge: unread },
  ];

  return (
    <div className="container-page py-10 sm:py-14">
      {/* ------------------------------------------------------------ header */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Signed in as <span className="text-fg">{user.name || user.email}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="btn-secondary !py-2">
            View site
          </Link>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="btn-ghost !py-2"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </header>

      {/* -------------------------------------------------------------- tabs */}
      <div role="tablist" aria-label="Dashboard sections" className="mt-6 flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-accent text-accent-fg"
                : "text-muted hover:bg-surface hover:text-fg"
            }`}
          >
            {t.label}
            <span
              className={`rounded px-1.5 py-0.5 text-xs ${
                tab === t.id ? "bg-black/15" : "bg-surface"
              }`}
            >
              {t.count}
            </span>
            {t.badge ? (
              <span className="rounded bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                {t.badge} new
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------ panels */}
      <div className="mt-8">
        {tab === "projects" && <ProjectEditor projects={projects} />}
        {tab === "posts" && <PostEditor posts={posts} />}
        {tab === "messages" && <MessageList messages={messages} />}
      </div>
    </div>
  );
}
