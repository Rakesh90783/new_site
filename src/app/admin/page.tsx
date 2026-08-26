import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listAllPosts, listContactMessages, listProjects } from "@/lib/queries";
import { Dashboard } from "@/components/admin/dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  // Middleware already redirects anonymous visitors; this is the second check
  // that actually gates the data, in case the matcher is ever changed.
  const user = await getSessionUser();
  if (!user) redirect("/admin/login?next=/admin");

  const [projects, posts, messages] = await Promise.all([
    listProjects(),
    listAllPosts(),
    listContactMessages(),
  ]);

  return (
    <Dashboard
      user={{ email: user.email, name: user.name }}
      projects={projects}
      posts={posts}
      messages={messages}
    />
  );
}
