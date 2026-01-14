import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { updateMissionProgress } from '@/lib/missionUtils';
import type { Conquest, Profile } from '@/types';
import * as turf from '@turf/turf';

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

      // Detect conflicts with other users' territories
      try {
        if (conquest.path.length >= 3) {
          const newPolygon = turf.polygon([[...conquest.path, conquest.path[0]].map(p => [p[1], p[0]])]);
          
          // Get all other users' conquests
          const { data: allConquests } = await supabase
            .from('conquests')
            .select('id, user_id, path, area')
            .neq('user_id', user.id);

          if (allConquests) {
            const conflictsToCreate: {
              invader_id: string;
              victim_id: string;
              conquest_id: string;
              area_invaded: number;
              latitude?: number;
              longitude?: number;
            }[] = [];

            for (const existingConquest of allConquests) {
              try {
                const existingPath = typeof existingConquest.path === 'string' 
                  ? JSON.parse(existingConquest.path) 
                  : existingConquest.path;
                
                if (existingPath.length < 3) continue;
                
                const existingPolygon = turf.polygon([[...existingPath, existingPath[0]].map((p: [number, number]) => [p[1], p[0]])]);
                
                // Check for intersection
                const intersection = turf.intersect(
                  turf.featureCollection([newPolygon, existingPolygon])
                );
                
                if (intersection) {
                  const intersectionArea = Math.round(turf.area(intersection));
                  
                  if (intersectionArea > 10) { // Minimum 10m² to register conflict
                    const centroid = turf.centroid(intersection);
                    const [lng, lat] = centroid.geometry.coordinates;
                    
                    conflictsToCreate.push({
                      invader_id: user.id,
                      victim_id: existingConquest.user_id,
                      conquest_id: data.id,
                      area_invaded: intersectionArea,
                      latitude: lat,
                      longitude: lng,
                    });
                  }
                }
              } catch (e) {
                // Skip invalid polygons
                console.warn('Error checking conflict:', e);
              }
            }

            // Insert all conflicts
            if (conflictsToCreate.length > 0) {
              await supabase
                .from('territory_conflicts')
                .insert(conflictsToCreate);
            }
          }
        }
      } catch (e) {
        console.error('Error detecting conflicts:', e);
        // Don't throw - conflict detection failure shouldn't block conquest
      }

      // Update mission progress for 'conquistador' (conquer 1 area)
      await updateMissionProgress(user.id, 'conquistador', 1);

      // Update mission progress for 'resistencia' if distance >= 2km
      if (conquest.distance >= 2) {
        await updateMissionProgress(user.id, 'resistencia', 1);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conquests'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['daily-missions'] });
    },
  });

  return { conquests, myConquests, isLoading, addConquest };
}
