# React Query Setup Guide

## What's Been Implemented

TanStack Query (React Query) has been integrated into your Kin app to provide:
- **Instant navigation** - No loading spinners when switching tabs
- **Automatic caching** - Data is stored in memory
- **Background updates** - Data refreshes silently in the background
- **Optimistic updates** - UI updates immediately when you perform actions
- **Realtime sync** - Chat messages update cache in real-time

## Installation

Run this command to install the missing persist packages (optional for offline support):

```bash
npm install
```

## What Changed

### 1. Root Layout (`app/_layout.tsx`)
- Added `QueryClient` with caching configuration
- Wrapped app in `QueryClientProvider` for memory caching
- Can upgrade to `PersistQueryClientProvider` after npm install for offline support

### 2. Custom Hooks Created

#### `hooks/useSocialData.ts`
Caches friend requests and friends list:
```typescript
const { requests, friends, isLoading, refresh } = useSocialData();
```

#### `hooks/useSuggestions.ts`
Caches friend suggestions:
```typescript
const { suggestions, isLoading, refresh } = useSuggestions();
```

#### `hooks/useProfile.ts`
Caches user profile data:
```typescript
const { profile, isLoading, refresh } = useProfile();
```

#### `hooks/useChatData.ts`
Caches chat rooms and messages:
```typescript
// For chat list
const { data: rooms, isLoading, refetch } = useChatRooms();

// For chat room messages
const { data: messages, isLoading } = useRoomMessages(roomId);
```

### 3. Updated Components

#### `app/(tabs)/People.tsx`
- Replaced `useEffect` + `useState` with React Query hooks
- Uses `queryClient.invalidateQueries()` for instant UI updates
- Resets to "Discover" tab when screen comes into focus
- No more manual loading state management

#### `app/(tabs)/chats/index.tsx`
- Uses `useChatRooms()` hook for cached room list
- Instant loading when switching between tabs
- Invalidates cache after deleting rooms

#### `app/chat/[id].tsx`
- Uses `useRoomMessages()` hook for cached messages
- Integrates React Query with Supabase Realtime
- Updates cache when new messages arrive via realtime
- Instant navigation between chat rooms

## How to Use in Other Components

### Basic Pattern

```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query';

function MyComponent() {
  const queryClient = useQueryClient();
  
  // Fetch data with caching
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-data'],
    queryFn: async () => {
      // Your fetch logic here
      return await fetchMyData();
    },
    staleTime: 1000 * 60 * 5, // Fresh for 5 minutes
  });
  
  // After mutations, invalidate cache
  const handleUpdate = async () => {
    await updateData();
    queryClient.invalidateQueries({ queryKey: ['my-data'] });
  };
  
  return <View>...</View>;
}
```

### Cache Invalidation

When you modify data (accept friend request, send message, etc.), tell React Query to refresh:

```typescript
// Invalidate single query
queryClient.invalidateQueries({ queryKey: ['friend-requests'] });

// Invalidate multiple queries
queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
queryClient.invalidateQueries({ queryKey: ['my-friends'] });
```

## Benefits You'll See

1. **No Loading Spinners** - Switch between tabs instantly
2. **Offline Support** - Data persists when app closes
3. **Less Code** - No more `useEffect` + `useState` boilerplate
4. **Better Performance** - Automatic deduplication and memory management
5. **Fresh Data** - Background updates keep data current

## Next Steps

Apply the same pattern to other screens:
- Chat messages list
- Profile screen
- Feed/Posts screen
- Any screen that fetches data

## Troubleshooting

If data isn't updating:
1. Check you're calling `queryClient.invalidateQueries()` after mutations
2. Verify the `queryKey` matches between `useQuery` and `invalidateQueries`
3. Check console for errors in `queryFn`

## Configuration

Adjust cache times in `app/_layout.tsx`:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5,     // 5 minutes
    },
  },
});
```

- `gcTime`: How long unused data stays in cache
- `staleTime`: How long data is considered "fresh"
