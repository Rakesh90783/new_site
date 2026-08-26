"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ContactMessage } from "@/lib/types";
import { apiRequest, RequestFailed } from "./api-client";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageList({ messages }: { messages: ContactMessage[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const visible = filter === "unread" ? messages.filter((m) => !m.is_read) : messages;

  async function setRead(message: ContactMessage, isRead: boolean) {
    setPendingId(message.id);
    setError(null);
    try {
      await apiRequest(`/api/contact/${message.id}`, {
        method: "PATCH",
        body: { is_read: isRead },
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof RequestFailed ? err.message : "Could not update the message.");
    } finally {
      setPendingId(null);
    }
  }

  async function remove(message: ContactMessage) {
    if (!window.confirm(`Delete the message from ${message.name}? This cannot be undone.`)) return;

    setPendingId(message.id);
    setError(null);
    try {
      await apiRequest(`/api/contact/${message.id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setError(err instanceof RequestFailed ? err.message : "Could not delete the message.");
    } finally {
      setPendingId(null);
    }
  }

  /** Opening a message marks it read, which is what you expect from an inbox. */
  function toggle(message: ContactMessage) {
    const opening = expanded !== message.id;
    setExpanded(opening ? message.id : null);
    if (opening && !message.is_read) void setRead(message, true);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {messages.length} message{messages.length === 1 ? "" : "s"} ·{" "}
          {messages.filter((m) => !m.is_read).length} unread
        </p>
        <div className="flex gap-1">
          {(["all", "unread"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === value ? "bg-accent text-accent-fg" : "text-muted hover:bg-surface"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-500"
        >
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="card mt-6 p-8 text-center text-sm text-muted">
          {filter === "unread" ? "Nothing unread." : "No contact submissions yet."}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {visible.map((message) => {
            const isOpen = expanded === message.id;
            return (
              <li
                key={message.id}
                className={`card p-4 ${message.is_read ? "" : "border-accent/40"}`}
              >
                <button
                  type="button"
                  onClick={() => toggle(message)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start gap-3 text-left"
                >
                  {!message.is_read && (
                    <span
                      aria-label="Unread"
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-medium text-fg">{message.name}</span>
                      <span className="text-sm text-muted">{message.email}</span>
                    </div>
                    <p className={`mt-1 text-sm text-muted ${isOpen ? "" : "line-clamp-1"}`}>
                      {isOpen ? "" : message.message}
                    </p>
                    <p className="mt-1 text-xs text-muted/70">
                      {formatDateTime(message.created_at)}
                    </p>
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 border-t border-line pt-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg/90">
                      {message.message}
                    </p>

                    {(message.ip || message.user_agent) && (
                      <dl className="mt-4 space-y-1 font-mono text-xs text-muted/70">
                        {message.ip && (
                          <div className="flex gap-2">
                            <dt>IP</dt>
                            <dd>{message.ip}</dd>
                          </div>
                        )}
                        {message.user_agent && (
                          <div className="flex gap-2">
                            <dt>UA</dt>
                            <dd className="break-all">{message.user_agent}</dd>
                          </div>
                        )}
                      </dl>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={`mailto:${message.email}?subject=${encodeURIComponent(
                          "Re: your message"
                        )}`}
                        className="btn-primary !px-3 !py-1.5 !text-xs"
                      >
                        Reply by email
                      </a>
                      <button
                        type="button"
                        onClick={() => setRead(message, !message.is_read)}
                        disabled={pendingId === message.id}
                        className="btn-ghost !px-3 !py-1.5 !text-xs"
                      >
                        Mark {message.is_read ? "unread" : "read"}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(message)}
                        disabled={pendingId === message.id}
                        className="btn-danger !px-3 !py-1.5 !text-xs"
                      >
                        {pendingId === message.id ? "Working…" : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
