import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useFollowingIds } from './useFollows';
import type { Profile, Conquest } from '@/types';

export interface ConquestPost {
  id: string;
  user_id: string;
  conquest_id: string;
  title: string;
  description: string | null;
  photo_urls: string[];
  map_snapshot_url: string | null;
  created_at: string;
  conquest?: Conquest;
  profile?: Profile;
}

// Global feed - all posts
export function useConquestPosts(userId?: string) {
  return useQuery({
    queryKey: ['conquest-posts', userId],
    queryFn: async () => {
      let query = supabase
        .from('conquest_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: posts, error } = await query;
      if (error) throw error;

      return enrichPosts(posts || []);
    },
  });
}

// Friends feed - only posts from users we follow
export function useFriendsFeed() {
  const { data: followingIds = [] } = useFollowingIds();

  return useQuery({
    queryKey: ['conquest-posts-friends', followingIds],
    queryFn: async () => {
      if (followingIds.length === 0) return [];

      const { data: posts, error } = await supabase
        .from('conquest_posts')
        .select('*')
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return enrichPosts(posts || []);
    },
    enabled: followingIds.length > 0,
  });
}

// Nearby feed - posts within a radius of user's location
export function useNearbyFeed(userLat?: number, userLng?: number, radiusKm: number = 50) {
  return useQuery({
    queryKey: ['conquest-posts-nearby', userLat, userLng, radiusKm],
    queryFn: async () => {
      if (!userLat || !userLng) return [];

      // Get all posts with conquest data
      const { data: posts, error } = await supabase
        .from('conquest_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get conquests to filter by location
      const conquestIds = [...new Set((posts || []).map(p => p.conquest_id))];
      const { data: conquests } = await supabase
        .from('conquests')
        .select('*')
        .in('id', conquestIds);

      // Filter by distance using Haversine formula
      const nearbyConquestIds = new Set<string>();
      (conquests || []).forEach(c => {
        const centerLat = c.center_latitude || (c.path as any)?.[0]?.[1];
        const centerLng = c.center_longitude || (c.path as any)?.[0]?.[0];
        
        if (centerLat && centerLng) {
          const distance = haversineDistance(userLat, userLng, centerLat, centerLng);
          if (distance <= radiusKm) {
            nearbyConquestIds.add(c.id);
          }
        }
      });

      const nearbyPosts = (posts || []).filter(p => nearbyConquestIds.has(p.conquest_id));
      return enrichPosts(nearbyPosts);
    },
    enabled: !!userLat && !!userLng,
  });
}

// Helper function to enrich posts with conquest and profile data
async function enrichPosts(posts: any[]): Promise<ConquestPost[]> {
  if (posts.length === 0) return [];

  const conquestIds = [...new Set(posts.map(p => p.conquest_id))];
  const userIds = [...new Set(posts.map(p => p.user_id))];

  const [{ data: conquests }, { data: profiles }] = await Promise.all([
    supabase.from('conquests').select('*').in('id', conquestIds),
    supabase.from('profiles').select('*').in('user_id', userIds),
  ]);

  const conquestMap: Record<string, Conquest> = {};
  (conquests || []).forEach(c => {
    conquestMap[c.id] = {
      ...c,
      path: c.path as [number, number][],
    };
  });

  const profileMap: Record<string, Profile> = {};
  (profiles || []).forEach(p => {
    profileMap[p.user_id] = p as Profile;
  });

  return posts.map(post => ({
    ...post,
    photo_urls: post.photo_urls || [],
    conquest: conquestMap[post.conquest_id],
    profile: profileMap[post.user_id],
  })) as ConquestPost[];
}

// Haversine formula to calculate distance between two points
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
