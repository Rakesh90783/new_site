import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { LoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;

  // Only accept same-site relative paths, so ?next= cannot be used to bounce
  // someone to an external site after a successful login.
  const redirectTo = next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";

  return (
    <div className="container-page flex min-h-[80vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p className="eyebrow">{site.name}</p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">Admin sign in</h1>
          <p className="mt-2 text-sm text-muted">
            Manage projects, posts, and contact submissions.
          </p>
        </div>

        <div className="mt-8">
          <LoginForm redirectTo={redirectTo} />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/" className="hover:text-accent">
            ← Back to the site
          </Link>
        </p>
      </div>
    </div>
  );
}
