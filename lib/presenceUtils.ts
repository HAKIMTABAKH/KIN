/**
 * Presence utility functions for the User Presence feature.
 * 
 * @module presenceUtils
 */

/**
 * Formats a last_seen timestamp into a human-readable relative time string.
 * 
 * @param dateString - ISO timestamp string, null, or undefined
 * @returns Human-readable string:
 *   - "Offline" for null/undefined input
 *   - "Just now" for < 1 minute ago
 *   - "Xm ago" for 1-59 minutes ago
 *   - "Xh ago" for 1-23 hours ago
 *   - "Xd ago" for 24+ hours ago
 * 
 * @example
 * formatLastSeen(null) // "Offline"
 * formatLastSeen(new Date().toISOString()) // "Just now"
 * formatLastSeen(new Date(Date.now() - 5 * 60 * 1000).toISOString()) // "5m ago"
 */
export function formatLastSeen(dateString?: string | null): string {
  // Handle null/undefined input - Requirements 6.5
  if (dateString === null || dateString === undefined) {
    return 'Offline';
  }

  const date = new Date(dateString);
  
  // Handle invalid date
  if (isNaN(date.getTime())) {
    return 'Offline';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  // Handle future dates (treat as just now)
  if (diffMs < 0) {
    return 'Just now';
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Requirements 6.1: < 1 minute
  if (diffSeconds < 60) {
    return 'Just now';
  }

  // Requirements 6.2: 1-59 minutes
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  // Requirements 6.3: 1-23 hours
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  // Requirements 6.4: 24+ hours
  return `${diffDays}d ago`;
}
