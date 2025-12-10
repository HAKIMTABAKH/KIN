import { supabase } from '@/lib/supabase';
import { Text, TouchableOpacity, View } from 'react-native';

interface BlockStatusUIProps {
  blockStatus: 'none' | 'blocked_by_me' | 'blocked_me';
  currentUserId: string | null;
  otherUserId: string | null;
  onUnblock: () => void;
}

export default function BlockStatusUI({ 
  blockStatus, 
  currentUserId, 
  otherUserId, 
  onUnblock 
}: BlockStatusUIProps) {
  if (blockStatus === 'none') return null;

  if (blockStatus === 'blocked_by_me') {
    return (
      <View className="bg-kin-midnight px-6 py-4 border-t border-kin-slate/30">
        <View className="bg-kin-slate/20 p-4 rounded-xl items-center">
          <Text className="text-kin-white font-outfit-bold text-base mb-2">
            You blocked this user
          </Text>
          <Text className="text-kin-mist text-sm text-center mb-4">
            Unblock to continue the conversation
          </Text>
          <TouchableOpacity
            onPress={async () => {
              if (!currentUserId || !otherUserId) return;
              const { data } = await supabase
                .from('blocked_users')
                .select('id')
                .eq('user_id', currentUserId)
                .eq('blocked_user_id', otherUserId)
                .single();
              
              if (data) {
                await supabase.from('blocked_users').delete().eq('id', data.id);
                onUnblock();
              }
            }}
            className="bg-kin-amber px-6 py-3 rounded-xl"
          >
            <Text className="text-black font-outfit-bold">Unblock User</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-kin-midnight px-6 py-4 border-t border-kin-slate/30">
      <View className="bg-red-500/10 p-4 rounded-xl items-center border border-red-500/20">
        <Text className="text-red-500 font-outfit-bold text-base mb-2">
          This user blocked you
        </Text>
        <Text className="text-kin-mist text-sm text-center">
          You can't send messages to this user
        </Text>
      </View>
    </View>
  );
}
