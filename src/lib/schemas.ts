import { z } from "zod";

/** Request-body validation. Every write endpoint parses through one of these. */

const slugField = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens");

const optionalUrl = z
  .union([z.string().trim().url("Must be a full URL including https://"), z.literal("")])
  .nullish()
  .transform((v) => (v ? v : null));

/** Accepts either a real array or a comma-separated string from a form field. */
const tagList = z
  .union([z.array(z.string()), z.string()])
  .default([])
  .transform((v) =>
    (Array.isArray(v) ? v : v.split(","))
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20)
  );

export const projectInput = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  slug: slugField,
  description: z.string().trim().min(1, "Description is required").max(2000),
  tech: tagList,
  demo_url: optionalUrl,
  repo_url: optionalUrl,
  thumbnail_url: optionalUrl,
  featured: z.coerce.boolean().default(false),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

/** PUT accepts a subset; at least one field must be present. */
export const projectPatch = projectInput
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export const postInput = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: slugField,
  excerpt: z.string().trim().max(400).nullish().transform((v) => v || null),
  body: z.string().trim().min(1, "Body is required"),
  cover_url: optionalUrl,
  tags: tagList,
  published: z.coerce.boolean().default(false),
});

export const postPatch = postInput
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export const contactInput = z.object({
  name: z.string().trim().min(1, "Please tell me your name").max(120),
  email: z.string().trim().toLowerCase().email("That does not look like a valid email").max(254),
  message: z
    .string()
    .trim()
    .min(10, "A little more detail, please (at least 10 characters)")
    .max(5000, "Please keep it under 5000 characters"),
  /**
   * Hidden field: real users leave it empty, naive bots fill it in. Accepted
   * rather than rejected here — the route handler checks it and returns a fake
   * success, so a bot learns nothing from the response.
   */
  honeypot: z.string().max(500).optional(),
});

export const loginInput = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required").max(200),
});

export { slugify } from "./slug";
