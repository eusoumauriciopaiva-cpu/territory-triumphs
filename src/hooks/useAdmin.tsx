import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Conquest } from '@/types';

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

interface AdminConquest {
  id: string;
  user_id: string;
  path: [number, number][];
  area: number;
  distance: number;
  duration: number | null;
  created_at: string;
  profile_name: string;
  profile_nickname: string | null;
  trail_color: string;
}

/**
 * Hook to check if user is an admin
 */
export function useIsAdmin() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      // Use the is_admin RPC function
      const { data, error } = await supabase.rpc('is_admin', { 
        _user_id: user.id 
      });
      
      if (error) {
        console.error('Error checking admin status:', error);
        // Fallback: check if user is developer
        const { data: isDev } = await supabase.rpc('is_developer', { 
          _user_id: user.id 
        });
        return isDev === true;
      }
      
      return data === true;
    },
    enabled: !!user,
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Hook to fetch all profiles (admin only)
 */
export function useAdminProfiles() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  
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
    enabled: !!user && isAdmin === true,
    staleTime: 60000,
  });
}

/**
 * Hook to fetch all conquests with profile data (admin only)
 */
export function useAdminConquests() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  
  return useQuery({
    queryKey: ['admin-conquests'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_conquests_admin');
      
      if (error) {
        console.error('Error fetching admin conquests:', error);
        throw error;
      }
      
      // Parse path JSON and return typed data
      return (data || []).map((c: any) => ({
        ...c,
        path: Array.isArray(c.path) ? c.path : JSON.parse(c.path || '[]'),
      })) as AdminConquest[];
    },
    enabled: !!user && isAdmin === true,
    staleTime: 60000,
  });
}

/**
 * Hook to fetch groups for filtering
 */
export function useAdminGroups() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  
  return useQuery({
    queryKey: ['admin-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          total_area,
          is_elite,
          group_members (
            user_id
          )
        `)
        .order('total_area', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && isAdmin === true,
    staleTime: 60000,
  });
}
