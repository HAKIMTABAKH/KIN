/**
 * Message Helper Functions
 * Utility functions for message processing and validation
 */

/**
 * Detect if message text contains ONLY emojis
 * @param text - The message text to check
 * @returns true if text contains only emojis, false otherwise
 */
export const isEmojiOnly = (text: string): boolean => {
  if (!text) return false;
  // Matches common emoji ranges, symbols, and whitespace
  const emojiRegex = /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}\u{2B00}-\u{2BFF}\u{200D}\u{FE0F}\s]+$/u;
  return emojiRegex.test(text);
};

/**
 * Normalize reply message data
 * Handles cases where reply_message might be an array or object
 * @param replyMessage - The reply message data from the database
 * @returns Normalized reply message object or null
 */
export const normalizeReplyData = (replyMessage: any): any => {
  if (!replyMessage) return null;
  
  // If reply_message is an array, take the first element
  if (Array.isArray(replyMessage) && replyMessage.length > 0) {
    return replyMessage[0];
  } else if (Array.isArray(replyMessage)) {
    return null;
  }
  
  return replyMessage;
};

/**
 * Get user initials from full name
 * @param fullName - User's full name
 * @returns First letter of the name in uppercase
 */
export const getUserInitial = (fullName?: string): string => {
  if (!fullName) return '?';
  return fullName.charAt(0).toUpperCase();
};

/**
 * Calculate minimum width for message bubble based on reactions
 * @param hasReactions - Whether the message has reactions
 * @returns Minimum width in pixels or undefined
 */
export const getMessageBubbleMinWidth = (hasReactions: boolean): number | undefined => {
  return hasReactions ? 70 : undefined;
};
