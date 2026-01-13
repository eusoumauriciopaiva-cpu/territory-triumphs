import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types';

/**
 * Hook to fetch all profiles for search and ranking purposes
 */
export function useProfiles() {
  return useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('total_area', { ascending: false });

      if (error) throw error;

      return (data || []) as Profile[];
    },
    staleTime: 60000,
  });
}
