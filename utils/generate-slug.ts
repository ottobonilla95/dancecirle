/**
 * Generate a URL-friendly slug from a name.
 * Handles diacritics (á -> a, ñ -> n), special chars, and whitespace.
 */
export function generateSlug(...parts: string[]): string {
  return parts
    .join("-")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
}
