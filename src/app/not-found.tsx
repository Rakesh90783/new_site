import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-display text-6xl font-bold text-accent">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        This page doesn&apos;t exist
      </h1>
      <p className="mt-3 max-w-md text-muted">
        The link may be out of date, or the page may have been renamed.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn-primary">
          Back home
        </Link>
        <Link href="/projects" className="btn-secondary">
          Browse projects
        </Link>
      </div>
    </div>
  );
}
