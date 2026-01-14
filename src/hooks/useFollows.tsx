import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Profile } from '@/types';

export interface FollowStats {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export function useFollowStats(targetUserId: string) {
  const { session } = useAuth();
  const currentUserId = session?.user?.id;

  return useQuery({
    queryKey: ['follow-stats', targetUserId, currentUserId],
    queryFn: async () => {
      const [
        { count: followersCount },
        { count: followingCount },
        { data: followData },
      ] = await Promise.all([
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', targetUserId),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', targetUserId),
        currentUserId
          ? supabase
              .from('follows')
              .select('id')
              .eq('follower_id', currentUserId)
              .eq('following_id', targetUserId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      return {
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
        isFollowing: !!followData,
      } as FollowStats;
    },
    enabled: !!targetUserId,
  });
}

export function useFollowersWithProfiles(userId: string) {
  return useQuery({
    queryKey: ['followers-profiles', userId],
    queryFn: async () => {
      const { data: follows, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId);

      if (error) throw error;
      if (!follows || follows.length === 0) return [];

      const followerIds = follows.map(f => f.follower_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', followerIds);

      return (profiles || []) as Profile[];
    },
    enabled: !!userId,
  });
}

export function useFollowingWithProfiles(userId: string) {
  return useQuery({
    queryKey: ['following-profiles', userId],
    queryFn: async () => {
      const { data: follows, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (error) throw error;
      if (!follows || follows.length === 0) return [];

      const followingIds = follows.map(f => f.following_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', followingIds);

      return (profiles || []) as Profile[];
    },
    enabled: !!userId,
  });
}

export function useFollow() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const followMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!session?.user?.id) throw new Error('Not authenticated');

      const { error } = await supabase.from('follows').insert({
        follower_id: session.user.id,
        following_id: targetUserId,
      });

      if (error) throw error;
    },
    onSuccess: (_, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['follow-stats', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['followers-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['following-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['conquest-posts'] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!session?.user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', session.user.id)
        .eq('following_id', targetUserId);

      if (error) throw error;
    },
    onSuccess: (_, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['follow-stats', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['followers-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['following-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['conquest-posts'] });
    },
  });

  return {
    follow: followMutation.mutate,
    unfollow: unfollowMutation.mutate,
    isFollowing: followMutation.isPending,
    isUnfollowing: unfollowMutation.isPending,
  };
}

export function useFollowingIds() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['following-ids', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];

      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', session.user.id);

      if (error) throw error;
      return (data || []).map(f => f.following_id);
    },
    enabled: !!session?.user?.id,
  });
}
