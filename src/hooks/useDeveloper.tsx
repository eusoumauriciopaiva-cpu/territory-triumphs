import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AdminProfile {
  id: string;
  user_id: string;
  email: string;
  name: string;
  nickname: string | null;
  unique_code: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  total_area: number;
  total_km: number;
  rank: string;
  current_streak: number;
  best_streak: number;
  created_at: string;
}

export function useIsDeveloper() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['is-developer', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase.rpc('is_developer', { 
        _user_id: user.id 
      });
      
      if (error) {
        console.error('Error checking developer status:', error);
        return false;
      }
      
      return data === true;
    },
    enabled: !!user,
    staleTime: 300000, // 5 minutes
  });
}

export function useAdminProfiles() {
  const { user } = useAuth();
  const { data: isDeveloper } = useIsDeveloper();
  
  return useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_profiles_admin');
      
      if (error) {
        console.error('Error fetching admin profiles:', error);
        throw error;
      }
      
      return (data || []) as AdminProfile[];
    },
    enabled: !!user && isDeveloper === true,
    staleTime: 60000,
  });
}
