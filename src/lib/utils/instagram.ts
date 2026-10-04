// Shared by the member form (live feedback) and the server action (the real
// check). Plain module: safe for client and server imports.

// Instagram usernames: letters, numbers, periods and underscores, max 30.
const HANDLE = /^[a-z0-9._]{1,30}$/;

/**
 * Accepts "@handle", "handle", "instagram.com/handle" or a full profile URL
 * and returns the bare lowercase username, or null if it isn't valid.
 */
export function normalizeInstagram(input: string): string | null {
  let value = input.trim();
  const url = value.match(/instagram\.com\/([^/?#\s]+)/i);
  if (url) value = url[1];
  value = value.replace(/^@+/, "").replace(/\/+$/, "").toLowerCase();
  if (!HANDLE.test(value) || value.startsWith(".") || value.endsWith(".")) {
    return null;
  }
  return value;
}

export function instagramUrl(username: string) {
  return `https://www.instagram.com/${username}/`;
}
