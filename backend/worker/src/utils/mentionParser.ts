/**
 * Mention Parser Utility
 *
 * Extracts mentioned user IDs from comment content.
 * Format: @[Display Name](userId)
 */

export interface ParsedMention {
  displayName: string;
  userId: string;
  fullMatch: string;
}

/**
 * Parse mentions from comment content
 * @param content - Comment content with mentions in format @[Name](userId)
 * @returns Array of parsed mentions
 */
export function parseMentions(content: string): ParsedMention[] {
  // Regex to match @[Name](userId) format
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions: ParsedMention[] = [];

  let match: RegExpExecArray | null;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push({
      fullMatch: match[0],
      displayName: match[1],
      userId: match[2],
    });
  }

  return mentions;
}

/**
 * Extract unique user IDs from mentions in content
 * Used for sending notifications
 * @param content - Comment content with mentions
 * @returns Array of unique user IDs
 */
export function extractMentionedUserIds(content: string): string[] {
  const mentions = parseMentions(content);
  // Return unique user IDs
  return Array.from(new Set(mentions.map(m => m.userId)));
}

/**
 * Check if a specific user is mentioned in content
 * @param content - Comment content
 * @param userId - User ID to check
 * @returns True if user is mentioned
 */
export function isUserMentioned(content: string, userId: string): boolean {
  const mentionedUserIds = extractMentionedUserIds(content);
  return mentionedUserIds.includes(userId);
}
