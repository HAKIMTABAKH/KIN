import ChatDetailsActionButton from '@/components/ChatDetailsActionButton';
import ChatDetailsMenuItem from '@/components/ChatDetailsMenuItem';
import ChatDetailsTabItem from '@/components/ChatDetailsTabItem';
import UserAvatar from '@/components/UserAvatar';
import { ChatMediaItem, fetchSharedMedia, fetchUserProfile } from '@/lib/chatDetails';
import { usePresence } from '@/lib/PresenceContext';
import { formatLastSeen } from '@/lib/presenceUtils';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Lock,
  MoreHorizontal,
  Palette,
  Play,
  Search,
  Timer,
  User,
  Users
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatDetailsScreen() {
  const router = useRouter();
  const { roomId, odataId } = useLocalSearchParams<{ roomId: string; odataId: string }>();
  const { width } = useWindowDimensions();
  const itemWidth = width / 3;

  const [profile, setProfile] = useState<any>(null);
  const [media, setMedia] = useState<ChatMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'media' | 'files' | 'links'>('media');

  const { onlineUsers } = usePresence();
  const isOnline = odataId ? onlineUsers.has(odataId) : false;

  useEffect(() => {
    loadDetails();
  }, []);

  async function loadDetails() {
    try {
      const [profileData, mediaData] = await Promise.all([
        fetchUserProfile(odataId || ''),
        fetchSharedMedia(roomId || '')
      ]);
      setProfile(profileData);
      setMedia(mediaData);
    } catch (error) {
      console.error('Error loading details:', error);
    } finally {
      setLoading(false);
    }
  }

  const openMedia = (index: number) => {
    const item = media[index];
    router.push({
      pathname: '/(app)/media-viewer',
      params: {
        uri: item.media_url,
        type: item.media_type,
        userName: profile?.full_name,
        avatar: profile?.avatar_url,
        timestamp: 'Shared Media',
        roomId: roomId,
      }
    });
  };

  const renderHeader = () => (
    <View className="items-center pt-2 pb-6">
      <View className="mb-4">
        <UserAvatar userId={odataId || ''} avatarUrl={profile?.avatar_url} size={112} />
      </View>
      <Text className="text-kin-white font-outfit-bold text-2xl mb-1">{profile?.full_name}</Text>
      <Text className={`font-outfit text-sm ${isOnline ? 'text-green-500' : 'text-kin-mist'}`}>
        {isOnline ? 'Online' : formatLastSeen(profile?.last_seen)}
      </Text>
      <View className="flex-row gap-6 mt-6">
        <ChatDetailsActionButton icon={User} label="Profile" onPress={() => router.push(`/user/${odataId}`)} />
        <ChatDetailsActionButton icon={Search} label="Search" onPress={() => {}} />
        <ChatDetailsActionButton icon={Bell} label="Mute" onPress={() => {}} />
        <ChatDetailsActionButton icon={MoreHorizontal} label="Options" onPress={() => {}} />
      </View>
    </View>
  );

  const renderMenu = () => (
    <View className="px-4 mb-6">
      <ChatDetailsMenuItem icon={Palette} label="Theme" value="Default" />
      <ChatDetailsMenuItem icon={Timer} label="Disappearing messages" value="Off" />
      <ChatDetailsMenuItem icon={Lock} label="Privacy & safety" />
      <ChatDetailsMenuItem icon={User} label="Nicknames" />
      <ChatDetailsMenuItem icon={Users} label="Create a group chat" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal" edges={['top']}>
      <View className="flex-row items-center px-4 py-2">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#F59E0B" className="mt-20" />
      ) : (
        <FlatList
          data={activeTab === 'media' ? media : []}
          keyExtractor={(item) => item.id}
          numColumns={3}
          ListHeaderComponent={
            <>
              {renderHeader()}
              {renderMenu()}
              <View className="flex-row mt-2 border-b border-kin-slate/20">
                <ChatDetailsTabItem icon={ImageIcon} isActive={activeTab === 'media'} onPress={() => setActiveTab('media')} />
                <ChatDetailsTabItem icon={FileText} isActive={activeTab === 'files'} onPress={() => setActiveTab('files')} />
                <ChatDetailsTabItem icon={LinkIcon} isActive={activeTab === 'links'} onPress={() => setActiveTab('links')} />
              </View>
            </>
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => openMedia(index)}
              style={{ width: itemWidth, height: itemWidth }}
              className="border border-kin-charcoal relative"
            >
              <Image
                source={{ uri: item.media_url }}
                style={{ width: '100%', height: '100%', backgroundColor: '#1e293b' }}
                contentFit="cover"
              />
              {item.media_type === 'video' && (
                <View className="absolute top-2 right-2 bg-black/50 p-1 rounded-full">
                  <Play size={12} color="white" fill="white" />
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="py-10 items-center">
              <Text className="text-kin-mist font-outfit">No shared media yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
