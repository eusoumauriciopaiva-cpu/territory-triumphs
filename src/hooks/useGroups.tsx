import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Group, GroupMember } from '@/types';

export function useGroups() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data: groupsData, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Get member counts
      const { data: membersData } = await supabase
        .from('group_members')
        .select('group_id');

      const memberCounts: Record<string, number> = {};
      (membersData || []).forEach(m => {
        memberCounts[m.group_id] = (memberCounts[m.group_id] || 0) + 1;
      });

      return (groupsData || []).map(g => ({
        ...g,
        member_count: memberCounts[g.id] || 0,
      })) as Group[];
    },
    enabled: !!user,
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ['my-memberships', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data.map(m => m.group_id);
    },
    enabled: !!user,
  });

  const createGroup = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({ name, created_by: user.id })
        .select()
        .single();
      
      if (groupError) throw groupError;

      // Auto-join the creator
      await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: user.id });
      
      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['my-memberships'] });
    },
  });

  const joinGroup = useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: user.id });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['my-memberships'] });
    },
  });

  const leaveGroup = useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['my-memberships'] });
    },
  });

  return { 
    groups, 
    myMemberships, 
    isLoading, 
    createGroup, 
    joinGroup, 
    leaveGroup 
  };
}
