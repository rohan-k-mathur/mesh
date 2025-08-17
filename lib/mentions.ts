// mentions.ts
export type MentionToken = { userId: string; start?: number; end?: number };

export function parseMentionsFromText(text: string, picked?: Array<{id:string; username:string}>): MentionToken[] {
  // Prefer explicit picks from the composer (IDs); fallback to @username regex
  // Map usernames → ids via cache; ignore unknowns
  // Return unique userIds; optionally fill ranges.
  return [];
}

// urls.ts
export function extractUrls(text: string): string[] {
  // robust URL regex or use linkify-it
  return [];
}

export function facetToPlainText(body: unknown): string {
    // Extract visible text for mention/url scanning. Keep it simple for MVP.
    return typeof body === 'string' ? body : JSON.stringify(body);
  }
  