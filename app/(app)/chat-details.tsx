import UserAvatar from '@/components/UserAvatar';
import { usePresence } from '@/lib/PresenceContext';
import { formatLastSeen } from '@/lib/presenceUtils';
import { supabase } from '@/lib/supabase';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft,
    Bell,
    ChevronRight,
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
    Dimensions,
    FlatList,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 3;

type MediaItem = {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
};

export default function ChatDetailsScreen() {
  const router = useRouter();
  const { roomId, odataId } = useLocalSearchParams<{ roomId: string; odataId: string }>();

  const [profile, setProfile] = useState<any>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'media' | 'files' | 'links'>('media');

  const { onlineUsers } = usePresence();
  const isOnline = odataId ? onlineUsers.has(odataId) : false;

  useEffect(() => {
    fetchDetails();
  }, []);


  async function fetchDetails() {
    try {
      // 1. Get User Profile
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', odataId)
        .single();
      setProfile(userData);

      // 2. Get Shared Media (Images/Videos)
      const { data: mediaData } = await supabase
        .from('messages')
        .select('id, media_url, media_type')
        .eq('room_id', roomId)
        .not('media_url', 'is', null)
        .order('created_at', { ascending: false });

      if (mediaData) setMedia(mediaData as MediaItem[]);
    } catch (error) {
      console.log('Error fetching details:', error);
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
      {/* Avatar with presence */}
      <View className="mb-4">
        <UserAvatar
          userId={odataId || ''}
          avatarUrl={profile?.avatar_url}
          size={112}
        />
      </View>

      {/* Name */}
      <Text className="text-kin-white font-outfit-bold text-2xl mb-1">
        {profile?.full_name}
      </Text>
      <Text className={`font-outfit text-sm ${isOnline ? 'text-green-500' : 'text-kin-mist'}`}>
        {isOnline ? 'Online' : formatLastSeen(profile?.last_seen)}
      </Text>

      {/* Action Row */}
      <View className="flex-row gap-6 mt-6">
        <ActionButton 
          icon={User} 
          label="Profile" 
          onPress={() => router.push(`/user/${odataId}`)}
        />
        <ActionButton icon={Search} label="Search" onPress={() => {}} />
        <ActionButton icon={Bell} label="Mute" onPress={() => {}} />
        <ActionButton icon={MoreHorizontal} label="Options" onPress={() => {}} />
      </View>
    </View>
  );

  const renderMenu = () => (
    <View className="px-4 mb-6">
      <MenuItem icon={Palette} label="Theme" value="Default" />
      <MenuItem icon={Timer} label="Disappearing messages" value="Off" />
      <MenuItem icon={Lock} label="Privacy & safety" />
      <MenuItem icon={User} label="Nicknames" />
      <MenuItem icon={Users} label="Create a group chat" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-kin-charcoal" edges={['top']}>
      {/* Top Bar */}
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

              {/* Media Tabs */}
              <View className="flex-row mt-2 border-b border-kin-slate/20">
                <TabItem
                  label="Media"
                  icon={ImageIcon}
                  isActive={activeTab === 'media'}
                  onPress={() => setActiveTab('media')}
                />
                <TabItem
                  label="Files"
                  icon={FileText}
                  isActive={activeTab === 'files'}
                  onPress={() => setActiveTab('files')}
                />
                <TabItem
                  label="Links"
                  icon={LinkIcon}
                  isActive={activeTab === 'links'}
                  onPress={() => setActiveTab('links')}
                />
              </View>
            </>
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => openMedia(index)}
              style={{ width: ITEM_WIDTH, height: ITEM_WIDTH }}
              className="border border-kin-charcoal relative"
            >
              <Image
                source={{ uri: item.media_url }}
                style={{ width: '100%', height: '100%', backgroundColor: '#1e293b' }}
                contentFit="cover"
              />
              {/* Video Indicator Overlay */}
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

// --- SUB COMPONENTS ---

const ActionButton = ({ icon: Icon, label, onPress }: { icon: any; label: string; onPress: () => void }) => (
  <View className="items-center">
    <TouchableOpacity 
      onPress={onPress}
      className="h-12 w-12 bg-kin-midnight rounded-full items-center justify-center border border-kin-slate/30 mb-1"
    >
      <Icon size={20} color="#F59E0B" />
    </TouchableOpacity>
    <Text className="text-kin-white text-xs font-outfit">{label}</Text>
  </View>
);

const MenuItem = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) => (
  <TouchableOpacity className="flex-row items-center py-4 border-b border-kin-slate/10">
    <Icon size={22} color="#9CA3AF" />
    <View className="flex-1 ml-4">
      <Text className="text-kin-white font-outfit-medium text-base">{label}</Text>
      {value && <Text className="text-kin-mist text-xs">{value}</Text>}
    </View>
    <ChevronRight size={20} color="#334155" />
  </TouchableOpacity>
);

const TabItem = ({ label, icon: Icon, isActive, onPress }: { label: string; icon: any; isActive: boolean; onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-1 items-center pb-3 border-b-2 ${isActive ? 'border-kin-amber' : 'border-transparent'}`}
  >
    <Icon size={20} color={isActive ? '#F59E0B' : '#7077A1'} />
  </TouchableOpacity>
);
