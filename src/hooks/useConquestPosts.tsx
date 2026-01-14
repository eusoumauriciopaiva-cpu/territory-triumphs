import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

      // Get conquest data for each post
      const conquestIds = [...new Set((posts || []).map(p => p.conquest_id))];
      const userIds = [...new Set((posts || []).map(p => p.user_id))];

      const [{ data: conquests }, { data: profiles }] = await Promise.all([
        supabase
          .from('conquests')
          .select('*')
          .in('id', conquestIds),
        supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds),
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

      return (posts || []).map(post => ({
        ...post,
        photo_urls: post.photo_urls || [],
        conquest: conquestMap[post.conquest_id],
        profile: profileMap[post.user_id],
      })) as ConquestPost[];
    },
  });
}
