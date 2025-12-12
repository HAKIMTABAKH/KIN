import { fetchMediaGallery } from '@/lib/chatDetails';
import { useQuery } from '@tanstack/react-query';

export function useMediaGallery(roomId: string) {
  return useQuery({
    queryKey: ['media-gallery', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      return await fetchMediaGallery(roomId);
    },
    enabled: !!roomId,
    staleTime: 1000 * 60 * 5, // Media gallery stays fresh for 5 minutes
  });
}
