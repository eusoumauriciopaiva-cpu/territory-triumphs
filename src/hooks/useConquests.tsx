import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Conquest, Profile } from '@/types';

export function useConquests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: conquests = [], isLoading } = useQuery({
    queryKey: ['conquests'],
    queryFn: async () => {
      // Get conquests
      const { data: conquestsData, error } = await supabase
        .from('conquests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      // Get profiles for the users
      const userIds = [...new Set((conquestsData || []).map(c => c.user_id))];
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);
      
      const profilesMap: Record<string, Profile> = {};
      (profilesData || []).forEach(p => {
        profilesMap[p.user_id] = p as Profile;
      });
      
      return (conquestsData || []).map(conquest => ({
        ...conquest,
        path: conquest.path as [number, number][],
        profile: profilesMap[conquest.user_id],
      })) as Conquest[];
    },
    enabled: !!user,
  });

  const myConquests = conquests.filter(c => c.user_id === user?.id);

  const addConquest = useMutation({
    mutationFn: async (conquest: { path: [number, number][]; area: number; distance: number }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('conquests')
        .insert({
          user_id: user.id,
          path: conquest.path,
          area: conquest.area,
          distance: conquest.distance,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conquests'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return { conquests, myConquests, isLoading, addConquest };
}
