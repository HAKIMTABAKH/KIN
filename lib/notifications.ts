import { Notification } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_SEEN_KEY = 'notifications_last_seen';

export function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function groupNotificationsByDate(
  notifs: Notification[],
  showOlderSections: boolean
) {
  const today: Notification[] = [];
  const rest: Notification[] = [];

  notifs.forEach(notif => {
    if (notif.time.includes('h ago') || notif.time.includes('m ago') || notif.time === 'Just now') {
      today.push(notif);
    } else {
      rest.push(notif);
    }
  });

  const sections = [];

  if (today.length > 0) {
    sections.push({ title: 'Today', data: today });
  }

  // Only show older notifications if requested
  if (rest.length > 0 && showOlderSections) {
    const yesterday: Notification[] = [];
    const older: Notification[] = [];

    rest.forEach(notif => {
      if (notif.time === '1d ago') {
        yesterday.push(notif);
      } else {
        older.push(notif);
      }
    });

    if (yesterday.length > 0) {
      sections.push({ title: 'Yesterday', data: yesterday });
    }

    if (older.length > 0) {
      sections.push({ title: 'Older', data: older });
    }
  }

  return sections;
}

export async function markNotificationsAsViewed(): Promise<void> {
  await AsyncStorage.setItem(LAST_SEEN_KEY, Date.now().toString());
}

export async function getLastSeenTimestamp(): Promise<number> {
  const lastSeen = await AsyncStorage.getItem(LAST_SEEN_KEY);
  return lastSeen ? parseInt(lastSeen) : 0;
}
