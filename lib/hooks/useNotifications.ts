import { MOCK_NOTIFICATIONS } from '@/lib/mockNotifications';
import { getTimeAgo, groupNotificationsByDate, markNotificationsAsViewed } from '@/lib/notifications';
import { acceptRequest, declineRequest, fetchRequests } from '@/lib/people';
import { supabase } from '@/lib/supabase';
import { Notification, NotificationSection } from '@/types';
import { useEffect, useState } from 'react';

const INITIAL_LOAD_COUNT = 8;

export function useNotifications() {
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [displayedNotifications, setDisplayedNotifications] = useState<Notification[]>([]);
  const [sections, setSections] = useState<NotificationSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadNotifications();
    markNotificationsAsViewed();
  }, []);

  async function loadNotifications() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      // Get friend requests
      const requests = await fetchRequests(user.id);

      // Convert friend requests to notifications
      const requestNotifications: Notification[] = requests.map(req => ({
        id: req.id,
        type: 'friend_request' as const,
        text: `${req.profiles.full_name} sent you a friend request`,
        time: getTimeAgo(new Date()),
        read: false,
        requester_id: req.requester_id,
        avatar_url: req.profiles.avatar_url,
        full_name: req.profiles.full_name
      }));

      // Combine with mock notifications
      const allNotifs = [...requestNotifications, ...MOCK_NOTIFICATIONS];
      setAllNotifications(allNotifs);

      // Show only first INITIAL_LOAD_COUNT
      const initial = allNotifs.slice(0, INITIAL_LOAD_COUNT);
      setDisplayedNotifications(initial);

      // Group notifications by date
      updateSections(initial, false);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }

  function updateSections(notifs: Notification[], showOlder: boolean) {
    const grouped = groupNotificationsByDate(notifs, showOlder);
    setSections(grouped);
  }

  function loadMoreNotifications() {
    setLoadingMore(true);

    setTimeout(() => {
      const currentCount = displayedNotifications.length;
      const nextBatch = allNotifications.slice(currentCount, currentCount + INITIAL_LOAD_COUNT);
      const updated = [...displayedNotifications, ...nextBatch];

      setDisplayedNotifications(updated);
      updateSections(updated, true);
      setLoadingMore(false);
    }, 500);
  }

  async function handleAccept(friendshipId: string, senderId: string) {
    if (!currentUserId || processingRequests.has(friendshipId)) return;

    setProcessingRequests(prev => new Set(prev).add(friendshipId));
    const success = await acceptRequest(currentUserId, friendshipId, senderId);

    if (success) {
      removeNotification(friendshipId);
    }

    setProcessingRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(friendshipId);
      return newSet;
    });
  }

  async function handleDecline(friendshipId: string) {
    if (processingRequests.has(friendshipId)) return;

    setProcessingRequests(prev => new Set(prev).add(friendshipId));
    const success = await declineRequest(friendshipId);

    if (success) {
      removeNotification(friendshipId);
    }

    setProcessingRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(friendshipId);
      return newSet;
    });
  }

  function removeNotification(notificationId: string) {
    const updatedAll = allNotifications.filter(n => n.id !== notificationId);
    const updatedDisplayed = displayedNotifications.filter(n => n.id !== notificationId);
    setAllNotifications(updatedAll);
    setDisplayedNotifications(updatedDisplayed);
    updateSections(updatedDisplayed, updatedDisplayed.length > INITIAL_LOAD_COUNT);
  }

  const hasMore = displayedNotifications.length < allNotifications.length;

  return {
    sections,
    loading,
    refreshing,
    loadingMore,
    currentUserId,
    processingRequests,
    allNotifications,
    displayedNotifications,
    hasMore,
    onRefresh,
    loadMoreNotifications,
    handleAccept,
    handleDecline,
    removeNotification
  };
}
