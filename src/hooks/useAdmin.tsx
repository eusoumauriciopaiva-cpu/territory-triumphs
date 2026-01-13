import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Conquest } from '@/types';

// Master admin email - only this user has access to command center
const MASTER_ADMIN_EMAIL = 'eusoumauriciopaiva1@gmail.com';

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
 * Hook to check if user is the Master Admin
 * Only eusoumauriciopaiva1@gmail.com has access
 */
export function useIsAdmin() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['is-admin', user?.id, user?.email],
    queryFn: async () => {
      if (!user) return false;
      
      // First check: email must match master admin
      if (user.email !== MASTER_ADMIN_EMAIL) {
        return false;
      }
      
      // Second check: verify in database using RPC function
      const { data, error } = await supabase.rpc('is_admin', { 
        _user_id: user.id 
      });
      
      if (error) {
        console.error('Error checking admin status:', error);
        // Fallback: check email only for master admin
        return user.email === MASTER_ADMIN_EMAIL;
      }
      
      return data === true;
    },
    enabled: !!user,
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Get the master admin email for display purposes
 */
export function getMasterAdminEmail() {
  return MASTER_ADMIN_EMAIL;
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
