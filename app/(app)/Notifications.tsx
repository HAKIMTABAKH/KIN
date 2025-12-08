import BottomSheetMenu from '@/components/BottomSheetMenu';
import NotificationCard from '@/components/NotificationCard';
import UserCard from '@/components/UserCard';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { Notification, NotificationSection } from '@/types';
import { useRouter } from 'expo-router';
import { AlertCircle, ArrowLeft, Bell, BellOff, Check, Ellipsis, EyeOff, Heart, MessageCircle, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, RefreshControl, SectionList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const {
    sections,
    loading,
    refreshing,
    loadingMore,
    processingRequests,
    allNotifications,
    displayedNotifications,
    hasMore,
    onRefresh,
    loadMoreNotifications,
    handleAccept,
    handleDecline,
    removeNotification
  } = useNotifications();

  function openMenu(notification: Notification) {
    setSelectedNotification(notification);
    setMenuVisible(true);
  }

  function handleDeleteNotification() {
    if (selectedNotification) {
      removeNotification(selectedNotification.id);
    }
    setMenuVisible(false);
  }

  function getNotificationIcon(type: Notification['type']) {
    switch (type) {
      case 'like':
        return <Heart size={20} color="#EF4444" fill="#EF4444" />;
      case 'comment':
        return <MessageCircle size={20} color="#3B82F6" />;
      case 'system':
        return <Bell size={20} color="#F59E0B" />;
      default:
        return <Bell size={20} color="#F59E0B" />;
    }
  }

  function renderNotificationItem(item: Notification) {
    if (item.type === 'friend_request') {
      return (
        <UserCard
          title={item.full_name || item.text}
          subtitle="Sent you a friend request"
          avatarUrl={item.avatar_url}
          onPress={() => item.requester_id && router.push(`/user/${item.requester_id}`)}
          rightAction={
            <TouchableOpacity onPress={() => openMenu(item)} className="h-8 w-8 items-center justify-center">
              <Ellipsis size={20} color="#7077A1" />
            </TouchableOpacity>
          }
          bottomAction={
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => handleAccept(item.id, item.requester_id!)}
                disabled={processingRequests.has(item.id)}
                className="flex-1 flex-row items-center justify-center py-3 bg-kin-amber rounded-xl"
              >
                <Check size={16} color="black" />
                <Text className="text-black font-outfit-bold ml-2 text-sm">ACCEPT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDecline(item.id)}
                disabled={processingRequests.has(item.id)}
                className="flex-1 flex-row items-center justify-center py-3 bg-kin-slate/30 rounded-xl"
              >
                <X size={16} color="#EF4444" />
                <Text className="text-kin-mist font-outfit-bold ml-2 text-sm">DECLINE</Text>
              </TouchableOpacity>
            </View>
          }
        />
      );
    }

    return (
      <NotificationCard
        icon={getNotificationIcon(item.type)}
        avatarUrl={item.avatar_url}
        title={item.text}
        subtitle={item.full_name || 'Kin'}
        time={item.time}
        onPress={() => {
          // TODO: Navigate to relevant content
        }}
        onMenuPress={() => openMenu(item)}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal">
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-kin-slate/30">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft color="#F59E0B" size={24} />
        </TouchableOpacity>
        <Text className="text-kin-white font-outfit-bold text-xl">Notifications</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#F59E0B" />
        </View>
      ) : allNotifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-20 w-20 bg-kin-midnight rounded-full items-center justify-center mb-4">
            <Bell size={40} color="#7077A1" />
          </View>
          <Text className="text-kin-white font-outfit-bold text-lg mb-2">
            No Notifications
          </Text>
          <Text className="text-kin-mist text-center font-outfit">
            You're all caught up!
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F59E0B"
              colors={['#F59E0B']}
            />
          }
          renderSectionHeader={({ section }: { section: NotificationSection }) => (
            <View className="mb-3">
              <Text className="text-kin-mist text-xs font-outfit-bold uppercase tracking-widest">
                {section.title}
              </Text>
            </View>
          )}
          ListFooterComponent={
            hasMore ? (
              <TouchableOpacity
                onPress={loadMoreNotifications}
                disabled={loadingMore}
                className="bg-kin-midnight border border-kin-slate/30 px-6 py-4 rounded-xl items-center mt-1"
              >
                {loadingMore ? (
                  <ActivityIndicator color="#F59E0B" />
                ) : (
                  <>
                    <Text className="text-kin-amber font-outfit-bold text-base ">
                      See Previous Notifications
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item }: { item: Notification }) => renderNotificationItem(item)}
        />
      )}

      {/* Bottom Sheet Menu */}
      <BottomSheetMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title="Notification Options"
        subtitle={selectedNotification?.full_name || 'Manage this notification'}
        items={[
          {
            icon: Trash2,
            label: 'Delete Notification',
            onPress: handleDeleteNotification,
            isDestructive: true
          },
          {
            icon: () => null,
            label: 'divider',
            onPress: () => {}
          },
          {
            icon: EyeOff,
            label: 'Hide Similar',
            onPress: () => {
              setMenuVisible(false);
              // TODO: Implement hide similar
            }
          },
          {
            icon: BellOff,
            label: 'Turn Off Notifications',
            onPress: () => {
              setMenuVisible(false);
              // TODO: Implement turn off notifications
            }
          },
          {
            icon: () => null,
            label: 'divider',
            onPress: () => {}
          },
          {
            icon: AlertCircle,
            label: 'Report Issue',
            onPress: () => {
              setMenuVisible(false);
              // TODO: Implement report issue
            }
          }
        ]}
        footer="More options coming soon"
      />
    </SafeAreaView>
  );
}
