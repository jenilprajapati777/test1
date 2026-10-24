/**
 * Generate a cryptographically secure 10-character base-36 slug.
 * Format: ^[a-z0-9]{10}$
 */
export function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  let slug = "";
  for (let i = 0; i < 10; i++) {
    slug += chars[bytes[i] % chars.length];
  }
  return slug;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]{10}$/.test(slug);
}
