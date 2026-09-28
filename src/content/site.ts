/**
 * ---------------------------------------------------------------------------
 * EDIT THIS FILE FIRST.
 *
 * Every piece of personal content on the site comes from here. Projects and
 * blog posts live in the database (manage them at /admin); the static copy —
 * name, pitch, bio, skills, education, links — lives in this file.
 *
 * Anything marked PLACEHOLDER still needs your real details.
 * ---------------------------------------------------------------------------
 */

export const site = {
  /** Shown in the nav, the hero, <title>, and the OG image. */
  name: "Rakesh Meher",

  /** Role / title. Appears under your name in the hero. */
  title: "Data Engineer & Automation Specialist", // PLACEHOLDER — confirm or change

  /** City, Country. */
  location: "PLACEHOLDER — City, Country",

  /**
   * One-line pitch: what you do and who you do it for. Keep it under ~140
   * characters — it is also the meta description and OG description.
   */
  pitch:
    "PLACEHOLDER — I build reliable data pipelines and automation for enterprise teams that are tired of firefighting.",

  /** Longer bio for the About page. One string per paragraph. */
  bio: [
    "PLACEHOLDER — Two or three sentences on what you actually do day to day, the kind of problems you like, and what you are good at. Write it the way you would explain your job to a smart friend outside your field.",
    "PLACEHOLDER — A second paragraph with a bit of history: how you got here, notable domains or scale you have worked at, and what you are currently learning or looking for.",
  ],

  /**
   * Skills grid on the About page. Add or remove groups freely — the layout
   * adapts to any number of them.
   */
  skills: [
    {
      group: "Languages",
      items: ["Python", "SQL", "Bash", "TypeScript"],
    },
    {
      group: "Data & ETL",
      items: ["Informatica PowerCenter", "Airflow", "dbt", "Kafka"],
    },
    {
      group: "Databases",
      items: ["Oracle", "PostgreSQL", "SQL Server", "Snowflake"],
    },
    {
      group: "Platform & Ops",
      items: ["Linux", "Ansible", "Docker", "Git", "CI/CD"],
    },
  ],

  /** Education / certifications, newest first. */
  education: [
    {
      qualification: "PLACEHOLDER — B.Tech, Computer Science",
      institution: "PLACEHOLDER — University name",
      period: "PLACEHOLDER — 2016 – 2020",
      note: "",
    },
  ],

  /**
   * Work history for the About page. Delete the array entirely if you would
   * rather not show it — the section hides itself when empty.
   */
  experience: [
    {
      role: "PLACEHOLDER — Your current role",
      company: "PLACEHOLDER — Company",
      period: "PLACEHOLDER — 2022 – present",
      summary:
        "PLACEHOLDER — One or two lines on scope and a concrete result. Numbers land better than adjectives.",
    },
  ],

  /**
   * Contact and social links. Set any value to an empty string and that link
   * disappears from the nav, footer, and contact page.
   */
  links: {
    email: "meherrakesh2019@gmail.com",
    github: "", // PLACEHOLDER — e.g. https://github.com/yourhandle
    linkedin: "", // PLACEHOLDER — e.g. https://www.linkedin.com/in/yourhandle
    twitter: "",
  },

  /**
   * Resume download. Drop your PDF at public/resume.pdf and leave this as-is,
   * or point it at an external URL. Empty string hides the download buttons.
   */
  resumeUrl: "/resume.pdf",

  /** Set false to hide the blog from the nav, sitemap, and home page. */
  blogEnabled: true,

  /** Used for the copyright line in the footer. */
  startYear: 2026,
} as const;

/**
 * Canonical origin. Reads NEXT_PUBLIC_SITE_URL, falls back to the Vercel-
 * provided URL, then localhost. No trailing slash.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  ...(site.blogEnabled ? [{ href: "/blog", label: "Blog" }] : []),
  { href: "/contact", label: "Contact" },
];
