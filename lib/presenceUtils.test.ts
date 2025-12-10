/**
 * Property-based tests for presenceUtils
 * 
 * Uses fast-check for property-based testing as specified in the design document.
 * Each property test runs a minimum of 100 iterations.
 */

import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatLastSeen } from './presenceUtils';

describe('formatLastSeen', () => {
  /**
   * **Feature: user-presence, Property 2: Time format correctness**
   * **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
   * 
   * For any valid ISO timestamp, the formatLastSeen function SHALL return a string that:
   * - Matches the pattern "Just now" when the time difference is less than 60 seconds
   * - Matches the pattern "[1-59]m ago" when the time difference is between 1 and 59 minutes
   * - Matches the pattern "[1-23]h ago" when the time difference is between 1 and 23 hours
   * - Matches the pattern "[1+]d ago" when the time difference is 24 hours or more
   */
  describe('Property 2: Time format correctness', () => {
    // Use a fixed "now" time for deterministic testing
    const fixedNow = new Date('2025-06-15T12:00:00.000Z');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(fixedNow);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "Just now" for timestamps less than 60 seconds ago', () => {
      fc.assert(
        fc.property(
          // Generate seconds from 0 to 59
          fc.integer({ min: 0, max: 59 }),
          (secondsAgo) => {
            const timestamp = new Date(fixedNow.getTime() - secondsAgo * 1000).toISOString();
            const result = formatLastSeen(timestamp);
            expect(result).toBe('Just now');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns "[X]m ago" for timestamps between 1 and 59 minutes ago', () => {
      fc.assert(
        fc.property(
          // Generate minutes from 1 to 59
          fc.integer({ min: 1, max: 59 }),
          (minutesAgo) => {
            const timestamp = new Date(fixedNow.getTime() - minutesAgo * 60 * 1000).toISOString();
            const result = formatLastSeen(timestamp);
            
            // Should match pattern "[1-59]m ago"
            const match = result.match(/^(\d+)m ago$/);
            expect(match).not.toBeNull();
            
            const parsedMinutes = parseInt(match![1], 10);
            expect(parsedMinutes).toBeGreaterThanOrEqual(1);
            expect(parsedMinutes).toBeLessThanOrEqual(59);
            expect(parsedMinutes).toBe(minutesAgo);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns "[X]h ago" for timestamps between 1 and 23 hours ago', () => {
      fc.assert(
        fc.property(
          // Generate hours from 1 to 23
          fc.integer({ min: 1, max: 23 }),
          (hoursAgo) => {
            const timestamp = new Date(fixedNow.getTime() - hoursAgo * 60 * 60 * 1000).toISOString();
            const result = formatLastSeen(timestamp);
            
            // Should match pattern "[1-23]h ago"
            const match = result.match(/^(\d+)h ago$/);
            expect(match).not.toBeNull();
            
            const parsedHours = parseInt(match![1], 10);
            expect(parsedHours).toBeGreaterThanOrEqual(1);
            expect(parsedHours).toBeLessThanOrEqual(23);
            expect(parsedHours).toBe(hoursAgo);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns "[X]d ago" for timestamps 24 hours or more ago', () => {
      fc.assert(
        fc.property(
          // Generate days from 1 to 365 (reasonable range)
          fc.integer({ min: 1, max: 365 }),
          (daysAgo) => {
            const timestamp = new Date(fixedNow.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
            const result = formatLastSeen(timestamp);
            
            // Should match pattern "[1+]d ago"
            const match = result.match(/^(\d+)d ago$/);
            expect(match).not.toBeNull();
            
            const parsedDays = parseInt(match![1], 10);
            expect(parsedDays).toBeGreaterThanOrEqual(1);
            expect(parsedDays).toBe(daysAgo);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
