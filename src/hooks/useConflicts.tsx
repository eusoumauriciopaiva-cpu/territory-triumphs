import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TerritoryConflict {
  id: string;
  invader_id: string;
  victim_id: string;
  conquest_id: string;
  area_invaded: number;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  is_read_by_victim: boolean;
  is_read_by_admin: boolean;
  created_at: string;
  invader_name?: string;
  invader_nickname?: string;
  victim_name?: string;
  victim_nickname?: string;
}

export function useUserConflicts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-conflicts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('territory_conflicts')
        .select(`
          *,
          invader:profiles!territory_conflicts_invader_id_fkey(name, nickname),
          victim:profiles!territory_conflicts_victim_id_fkey(name, nickname)
        `)
        .eq('victim_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback query without joins if foreign key not set up
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('territory_conflicts')
          .select('*')
          .eq('victim_id', user.id)
          .order('created_at', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        return (fallbackData || []) as TerritoryConflict[];
      }

      return (data || []).map((c: any) => ({
        ...c,
        invader_name: c.invader?.name,
        invader_nickname: c.invader?.nickname,
        victim_name: c.victim?.name,
        victim_nickname: c.victim?.nickname,
      })) as TerritoryConflict[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useUnreadConflictCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-conflicts', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count, error } = await supabase
        .from('territory_conflicts')
        .select('*', { count: 'exact', head: true })
        .eq('victim_id', user.id)
        .eq('is_read_by_victim', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 15000, // Check more frequently
  });
}

export function useMarkConflictAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (conflictId: string) => {
      const { error } = await supabase
        .from('territory_conflicts')
        .update({ is_read_by_victim: true })
        .eq('id', conflictId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['unread-conflicts'] });
    },
  });
}

export function useMarkAllConflictsAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      const { error } = await supabase
        .from('territory_conflicts')
        .update({ is_read_by_victim: true })
        .eq('victim_id', user.id)
        .eq('is_read_by_victim', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['unread-conflicts'] });
    },
  });
}

export function useCreateConflict() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conflict: {
      invader_id: string;
      victim_id: string;
      conquest_id: string;
      area_invaded: number;
      location_name?: string;
      latitude?: number;
      longitude?: number;
    }) => {
      const { data, error } = await supabase
        .from('territory_conflicts')
        .insert(conflict)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['unread-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-conflicts'] });
    },
  });
}

export function useAdminConflicts() {
  return useQuery({
    queryKey: ['admin-conflicts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_all_conflicts_admin');

      if (error) throw error;
      return (data || []) as TerritoryConflict[];
    },
    refetchInterval: 30000,
  });
}
