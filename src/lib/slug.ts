/**
 * Title -> URL slug. Lives in its own module (rather than schemas.ts) so the
 * admin forms can import it without pulling zod into the client bundle.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    // strip the combining diacritical marks that NFKD leaves behind
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
