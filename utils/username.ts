// Reserved words that cannot be used as usernames (locale prefixes, route names, etc.)
// Must include every static route segment under app/[locale]/* plus infra paths.
const RESERVED_USERNAMES = [
  "en", "es", "admin", "api", "dashboard", "settings", "onboarding",
  "feed", "friends", "discover", "cities", "countries", "music",
  "stats", "blog", "signin", "invite", "messages", "leaderboards",
  "city", "continent", "country", "dancer", "dj", "events",
  "organizer-events", "release", "releases", "profile",
  "privacy-policy", "tos", "unsubscribe-success", "dance-style",
  "auth", "sitemap.xml", "robots.txt", "manifest.json", "favicon.ico",
];

/**
 * Check if a username is valid according to our rules
 */
export function isValidUsername(username: string): boolean {
  if (!username) return false;

  const regex = /^[a-z0-9_]+$/;
  return (
    regex.test(username) &&
    username.length >= 3 &&
    username.length <= 20 &&
    !username.startsWith('_') &&
    !username.endsWith('_') &&
    !RESERVED_USERNAMES.includes(username)
  );
}

/**
 * Validate username and return error message if invalid
 */
export function validateUsername(value: string): string {
  const regex = /^[a-z0-9_]+$/;
  if (!value) return "Username is required";
  if (value.length < 3) return "Username must be at least 3 characters";
  if (value.length > 20) return "Username must be 20 characters or less";
  if (!regex.test(value))
    return "Username can only contain lowercase letters, numbers, and underscores";
  if (value.startsWith("_") || value.endsWith("_"))
    return "Username cannot start or end with an underscore";
  if (RESERVED_USERNAMES.includes(value))
    return "This username is reserved";
  return "";
}

/**
 * Generate username suggestions based on a name
 */
export function generateSuggestions(name: string): string[] {
  if (!name) return [];

  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_");
  const suggestions = [
    cleanName,
    `${cleanName}_dancer`,
    `${cleanName}_dance`,
    `${cleanName}123`,
    `dance_${cleanName}`,
    `${cleanName}_2024`,
  ].filter((s) => s.length >= 3 && s.length <= 20);

  return suggestions.slice(0, 3);
} 