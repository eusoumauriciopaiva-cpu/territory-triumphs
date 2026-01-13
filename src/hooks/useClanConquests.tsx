import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Conquest } from '@/types';

/**
 * Hook that returns conquests filtered by clan membership (Fog of War logic)
 * Only shows conquests from users in the same group as the current user
 */
export function useClanConquests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['clan-conquests', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First get user's group memberships
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (!memberships || memberships.length === 0) {
        // User not in any group - only show their own conquests
        const { data: ownConquests, error } = await supabase
          .from('conquests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return (ownConquests || []).map(c => ({
          ...c,
          path: c.path as [number, number][],
        })) as Conquest[];
      }

      // Get all members of user's groups
      const groupIds = memberships.map(m => m.group_id);
      const { data: clanMembers } = await supabase
        .from('group_members')
        .select('user_id')
        .in('group_id', groupIds);

      if (!clanMembers) return [];

      // Get unique member IDs
      const memberIds = [...new Set(clanMembers.map(m => m.user_id))];

      // Fetch conquests from all clan members
      const { data: conquests, error } = await supabase
        .from('conquests')
        .select('*')
        .in('user_id', memberIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', memberIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (conquests || []).map(c => ({
        ...c,
        path: c.path as [number, number][],
        profile: profileMap.get(c.user_id),
      })) as Conquest[];
    },
    enabled: !!user,
    staleTime: 30000,
  });
}
