import { Notification } from '@/types';

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'mock-1',
    type: 'like',
    text: 'Sarah liked your message',
    time: '2h ago',
    read: false,
    avatar_url: 'https://i.pravatar.cc/150?img=1',
    full_name: 'Sarah Johnson'
  },
  {
    id: 'mock-2',
    type: 'comment',
    text: 'Mike commented on your post',
    time: '5h ago',
    read: true,
    avatar_url: 'https://i.pravatar.cc/150?img=2',
    full_name: 'Mike Chen'
  },
  {
    id: 'mock-3',
    type: 'system',
    text: 'Welcome to Kin! Complete your profile to get started',
    time: '1d ago',
    read: true
  },
  {
    id: 'mock-4',
    type: 'like',
    text: 'Emma reacted ❤️ to your message',
    time: '3h ago',
    read: false,
    avatar_url: 'https://i.pravatar.cc/150?img=3',
    full_name: 'Emma Wilson'
  },
  {
    id: 'mock-5',
    type: 'like',
    text: 'John liked your post',
    time: '4h ago',
    read: false,
    avatar_url: 'https://i.pravatar.cc/150?img=4',
    full_name: 'John Doe'
  },
  {
    id: 'mock-6',
    type: 'comment',
    text: 'Lisa replied to your comment',
    time: '6h ago',
    read: true,
    avatar_url: 'https://i.pravatar.cc/150?img=5',
    full_name: 'Lisa Brown'
  },
  {
    id: 'mock-7',
    type: 'like',
    text: 'David reacted to your message',
    time: '7h ago',
    read: true,
    avatar_url: 'https://i.pravatar.cc/150?img=6',
    full_name: 'David Smith'
  },
  {
    id: 'mock-8',
    type: 'system',
    text: 'New features available! Check them out',
    time: '2d ago',
    read: true
  },
  {
    id: 'mock-9',
    type: 'like',
    text: 'Anna liked your photo',
    time: '3d ago',
    read: true,
    avatar_url: 'https://i.pravatar.cc/150?img=7',
    full_name: 'Anna Taylor'
  }
];
