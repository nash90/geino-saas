import React from "react";

/**
 * Mention Utilities
 *
 * Handles parsing and formatting of @mentions in comments.
 * Format: @[Display Name](userId)
 */

export interface ParsedMention {
  displayName: string;
  userId: string;
  fullMatch: string;
}

/**
 * Parse mentions from comment content
 * Extracts all @[Name](userId) mentions
 */
export function parseMentions(content: string): ParsedMention[] {
  // Regex to match @[Name](userId) format
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions: ParsedMention[] = [];

  let match;
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
 * Extract user IDs from mentions in content
 * Used for sending notifications
 */
export function extractMentionedUserIds(content: string): string[] {
  const mentions = parseMentions(content);
  return mentions.map(m => m.userId);
}

/**
 * Format mention text for display
 * Converts @[Name](userId) to styled display format
 */
export function formatMentionsForDisplay(content: string): React.ReactNode[] {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    // Add formatted mention
    parts.push(
      <span
        key={`mention-${match.index}`}
        className="bg-indigo-100 text-indigo-800 px-1 rounded font-medium"
      >
        @{match[1]}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
}
