"use client";

import { useState } from "react";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

/**
 * Posts to /api/contact. Field-level errors returned by the API are mapped back
 * onto the inputs; anything else surfaces as a single form-level message.
 */
export function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    setStatus({ kind: "sending" });
    setFieldErrors({});

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (payload.fields) {
          const flat: Record<string, string> = {};
          for (const [key, messages] of Object.entries(
            payload.fields as Record<string, string[]>
          )) {
            flat[key] = messages[0] ?? "Invalid value";
          }
          setFieldErrors(flat);
        }
        setStatus({
          kind: "error",
          message: payload.error ?? `Could not send your message (HTTP ${res.status}).`,
        });
        return;
      }

      form.reset();
      setStatus({ kind: "sent" });
    } catch {
      setStatus({
        kind: "error",
        message: "Network error — check your connection and try again.",
      });
    }
  }

  if (status.kind === "sent") {
    return (
      <div className="card animate-fade-up p-8 text-center" role="status">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/15">
          <svg
            className="h-6 w-6 text-accent"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h3 className="mt-4 font-display text-lg font-semibold">Message sent</h3>
        <p className="mt-1 text-sm text-muted">
          Thanks for reaching out — I&apos;ll get back to you soon.
        </p>
        <button
          type="button"
          onClick={() => setStatus({ kind: "idle" })}
          className="btn-secondary mt-6"
        >
          Send another
        </button>
      </div>
    );
  }

  const sending = status.kind === "sending";

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-5 p-6 sm:p-8">
      <div>
        <label htmlFor="name" className="label">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={120}
          autoComplete="name"
          disabled={sending}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
          className="input"
          placeholder="Ada Lovelace"
        />
        {fieldErrors.name && (
          <p id="name-error" className="mt-1.5 text-xs text-red-500">
            {fieldErrors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          disabled={sending}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          className="input"
          placeholder="ada@example.com"
        />
        {fieldErrors.email && (
          <p id="email-error" className="mt-1.5 text-xs text-red-500">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="label">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          minLength={10}
          maxLength={5000}
          disabled={sending}
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={fieldErrors.message ? "message-error" : undefined}
          className="input resize-y"
          placeholder="What would you like to build?"
        />
        {fieldErrors.message && (
          <p id="message-error" className="mt-1.5 text-xs text-red-500">
            {fieldErrors.message}
          </p>
        )}
      </div>

      {/* Honeypot: hidden from people, tempting to naive bots. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="honeypot">Leave this field empty</label>
        <input id="honeypot" name="honeypot" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {status.kind === "error" && (
        <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {status.message}
        </p>
      )}

      <button type="submit" disabled={sending} className="btn-primary w-full">
        {sending ? "Sending…" : "Send message"}
      </button>

      <p className="text-center text-xs text-muted">
        Your details are stored only so I can reply. No newsletter, no sharing.
      </p>
    </form>
  );
}
