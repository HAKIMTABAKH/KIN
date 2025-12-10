import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from './supabase';

type PresenceContextType = {
  onlineUsers: Set<string>;
};

const PresenceContext = createContext<PresenceContextType>({ onlineUsers: new Set() });

export const usePresence = () => useContext(PresenceContext);

export const PresenceProvider = ({ children }: { children: React.ReactNode }) => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const channelRef = useRef<any>(null);
  const userIdRef = useRef<string | null>(null);

  const updateLastSeen = async (uid: string) => {
    try {
      await supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', uid);
    } catch (err) {
      console.error('Error updating last_seen:', err);
    }
  };

  useEffect(() => {
    const setupPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('PresenceContext: No user found');
        return;
      }
      
      userIdRef.current = user.id;
      console.log('PresenceContext: Setting up for user', user.id);

      // Create the presence channel
      const channel = supabase.channel('global_presence', {
        config: { presence: { key: user.id } },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const userIds = new Set<string>(Object.keys(state));
          console.log('PresenceContext: Sync - Online users:', Array.from(userIds));
          setOnlineUsers(userIds);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('PresenceContext: User joined:', key);
          setOnlineUsers(prev => new Set([...prev, key]));
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('PresenceContext: User left:', key);
          setOnlineUsers(prev => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        })
        .subscribe(async (status) => {
          console.log('PresenceContext: Channel status:', status);
          if (status === 'SUBSCRIBED') {
            const trackResult = await channel.track({ 
              online_at: new Date().toISOString(),
              user_id: user.id 
            });
            console.log('PresenceContext: Track result:', trackResult);
          }
        });

      channelRef.current = channel;

      // Update last_seen on mount
      updateLastSeen(user.id);
    };

    setupPresence();

    // Handle App State Changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const uid = userIdRef.current;
      if (!uid) return;

      if (nextAppState === 'active') {
        updateLastSeen(uid);
        channelRef.current?.track({ 
          online_at: new Date().toISOString(),
          user_id: uid 
        });
      } else if (nextAppState.match(/inactive|background/)) {
        updateLastSeen(uid);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      console.log('PresenceContext: Cleaning up');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      subscription.remove();
    };
  }, []); // Empty dependency - only run once on mount

  return (
    <PresenceContext.Provider value={{ onlineUsers }}>
      {children}
    </PresenceContext.Provider>
  );
};
