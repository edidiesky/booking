import md5 from "blueimp-md5";

/**
 * Builds a Gravatar URL for the given email. Gravatar's own `d=mp`
 * ("mystery person") default handles the "no gravatar registered for
 * this email" case server-side, silhouette icon, no client-side logic
 * needed for that specific case. This function's only job is producing
 * a correct, hashed URL, callers still need their own fallback (initials,
 * a generic icon) for when there's no email at all to hash.
 */
export function getGravatarUrl(email: string | null | undefined, size = 80): string | null {
  if (!email) return null;
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?d=mp&s=${size}`;
}