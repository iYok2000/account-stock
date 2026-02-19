/**
 * Strip HTML tags from user input strings to prevent stored XSS.
 * Defense-in-depth; React also escapes by default.
 */
export function sanitizeString(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}
