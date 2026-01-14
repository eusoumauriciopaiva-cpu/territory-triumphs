import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { toast } from 'sonner';

export type MissionType = 'viral' | 'resistencia' | 'engajamento' | 'apoio' | 'conquistador';

export interface Mission {
  id: string;
  type: MissionType;
  name: string;
  description: string;
  xpReward: number;
  target: number;
  progress: number;
  collected: boolean;
  icon: string;
}

const MISSION_CONFIG: Record<MissionType, Omit<Mission, 'id' | 'progress' | 'collected'>> = {
  viral: {
    type: 'viral',
    name: 'Viral',
    description: 'Compartilhar uma área conquistada',
    xpReward: 200,
    target: 1,
    icon: '📤',
  },
  resistencia: {
    type: 'resistencia',
    name: 'Resistência',
    description: 'Fechar circuito de 2km+',
    xpReward: 150,
    target: 1,
    icon: '🏃',
  },
  engajamento: {
    type: 'engajamento',
    name: 'Engajamento',
    description: 'Comentar em 2 posts',
    xpReward: 50,
    target: 2,
    icon: '💬',
  },
  apoio: {
    type: 'apoio',
    name: 'Apoio',
    description: 'Reagir em 3 conquistas',
    xpReward: 30,
    target: 3,
    icon: '👏',
  },
  conquistador: {
    type: 'conquistador',
    name: 'Conquistador',
    description: 'Dominar 1 nova área',
    xpReward: 100,
    target: 1,
    icon: '🏆',
  },
};

const getTodayDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export function useDailyMissions() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const today = getTodayDate();

  const { data: missions, isLoading } = useQuery({
    queryKey: ['daily-missions', user?.id, today],
    queryFn: async () => {
      if (!user) return [];

      // Fetch existing missions for today
      const { data: existingMissions, error } = await supabase
        .from('user_missions_daily')
        .select('*')
        .eq('user_id', user.id)
        .eq('mission_date', today);

      if (error) throw error;

      // Create missions array with config
      const missionTypes: MissionType[] = ['viral', 'resistencia', 'engajamento', 'apoio', 'conquistador'];
      
      const missionsWithProgress: Mission[] = missionTypes.map((type) => {
        const config = MISSION_CONFIG[type];
        const existing = existingMissions?.find((m: any) => m.mission_type === type);

        return {
          id: existing?.id || type,
          ...config,
          progress: existing?.progress || 0,
          collected: existing?.collected || false,
        };
      });

      return missionsWithProgress;
    },
    enabled: !!user,
  });

  const initializeMissions = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const missionTypes: MissionType[] = ['viral', 'resistencia', 'engajamento', 'apoio', 'conquistador'];

      for (const type of missionTypes) {
        const config = MISSION_CONFIG[type];
        
        await supabase
          .from('user_missions_daily')
          .upsert({
            user_id: user.id,
            mission_date: today,
            mission_type: type,
            progress: 0,
            target: config.target,
            xp_reward: config.xpReward,
            collected: false,
          }, {
            onConflict: 'user_id,mission_date,mission_type',
            ignoreDuplicates: true,
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-missions', user?.id, today] });
    },
  });

  const updateMissionProgress = useMutation({
    mutationFn: async ({ type, increment = 1 }: { type: MissionType; increment?: number }) => {
      if (!user) throw new Error('Not authenticated');

      const config = MISSION_CONFIG[type];

      // First check if mission exists for today
      const { data: existing } = await supabase
        .from('user_missions_daily')
        .select('*')
        .eq('user_id', user.id)
        .eq('mission_date', today)
        .eq('mission_type', type)
        .maybeSingle();

      if (existing) {
        // Don't update if already collected
        if (existing.collected) return;

        const newProgress = Math.min(existing.progress + increment, config.target);
        await supabase
          .from('user_missions_daily')
          .update({ progress: newProgress })
          .eq('id', existing.id);
      } else {
        // Create new mission entry
        await supabase
          .from('user_missions_daily')
          .insert({
            user_id: user.id,
            mission_date: today,
            mission_type: type,
            progress: Math.min(increment, config.target),
            target: config.target,
            xp_reward: config.xpReward,
            collected: false,
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-missions', user?.id, today] });
    },
  });

  const collectMissionXP = useMutation({
    mutationFn: async (type: MissionType) => {
      if (!user) throw new Error('Not authenticated');

      const config = MISSION_CONFIG[type];

      // Get the mission
      const { data: mission, error: missionError } = await supabase
        .from('user_missions_daily')
        .select('*')
        .eq('user_id', user.id)
        .eq('mission_date', today)
        .eq('mission_type', type)
        .maybeSingle();

      if (missionError) throw missionError;
      if (!mission) throw new Error('Mission not found');
      if (mission.collected) throw new Error('Already collected');
      if (mission.progress < mission.target) throw new Error('Mission not complete');

      // Mark as collected
      const { error: updateError } = await supabase
        .from('user_missions_daily')
        .update({ collected: true })
        .eq('id', mission.id);

      if (updateError) throw updateError;

      // Add XP to profile
      if (profile) {
        const newXP = (profile.xp || 0) + config.xpReward;
        const newLevel = Math.floor(newXP / 1000) + 1;

        await supabase
          .from('profiles')
          .update({ 
            xp: newXP,
            level: newLevel,
          })
          .eq('user_id', user.id);
      }

      return config.xpReward;
    },
    onSuccess: (xpGained) => {
      queryClient.invalidateQueries({ queryKey: ['daily-missions', user?.id, today] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success(`+${xpGained} XP coletado!`, {
        icon: '⭐',
      });
    },
    onError: (error) => {
      toast.error('Erro ao coletar XP');
      console.error(error);
    },
  });

  // Calculate level progress
  const currentXP = profile?.xp || 0;
  const currentLevel = profile?.level || 1;
  const xpForCurrentLevel = (currentLevel - 1) * 1000;
  const xpForNextLevel = currentLevel * 1000;
  const xpProgress = currentXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const levelProgress = (xpProgress / xpNeeded) * 100;

  return {
    missions: missions || [],
    isLoading,
    initializeMissions,
    updateMissionProgress,
    collectMissionXP,
    currentLevel,
    currentXP,
    xpProgress,
    xpNeeded,
    levelProgress,
  };
}
