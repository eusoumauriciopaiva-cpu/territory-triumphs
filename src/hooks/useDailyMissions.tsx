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
    target: 2, // 2 km
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

const getTodayStartEnd = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

export function useDailyMissions() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const today = getTodayDate();
  const { start: todayStart, end: todayEnd } = getTodayStartEnd();

  // Buscar conquistas do dia de hoje
  const { data: todayConquests = [] } = useQuery({
    queryKey: ['today-conquests', user?.id, today],
    queryFn: async () => {
      if (!user) return [];

      try {
        const { data, error } = await supabase
          .from('conquests')
          .select('distance, area, created_at')
          .eq('user_id', user.id)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching today conquests:', error);
          return [];
        }

        return data || [];
      } catch (error) {
        console.error('Error in today conquests query:', error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 30000, // Cache por 30 segundos
  });

  // Calcular estatísticas do dia
  const todayStats = {
    totalKm: todayConquests.reduce((sum, c) => sum + Number(c.distance || 0), 0),
    totalArea: todayConquests.reduce((sum, c) => sum + Number(c.area || 0), 0),
    conquestCount: todayConquests.length,
  };

  const { data: missions, isLoading } = useQuery({
    queryKey: ['daily-missions', user?.id, today],
    queryFn: async () => {
      if (!user) return [];

      try {
        // Buscar missões existentes para hoje
        const { data: existingMissions, error } = await supabase
          .from('user_missions_daily')
          .select('*')
          .eq('user_id', user.id)
          .eq('mission_date', today);

        if (error) {
          console.error('Error fetching missions:', error);
          // Continuar mesmo com erro, criar missões padrão
        }

        // Criar array de missões com progresso calculado das conquistas
        const missionTypes: MissionType[] = ['viral', 'resistencia', 'engajamento', 'apoio', 'conquistador'];
        
        const missionsWithProgress: Mission[] = missionTypes.map((type) => {
          const config = MISSION_CONFIG[type];
          const existing = existingMissions?.find((m: any) => m.mission_type === type);

          // Calcular progresso baseado nas conquistas reais
          let calculatedProgress = 0;
          
          if (type === 'resistencia') {
            // Somar total_km das conquistas de hoje
            calculatedProgress = Math.min(todayStats.totalKm, config.target);
          } else if (type === 'conquistador') {
            // Contar quantidade de conquistas de hoje
            calculatedProgress = Math.min(todayStats.conquestCount, config.target);
          } else {
            // Para outras missões, usar progresso salvo ou 0
            calculatedProgress = existing?.progress || 0;
          }

          // Usar o maior valor entre o calculado e o salvo (para não perder progresso)
          const finalProgress = Math.max(calculatedProgress, existing?.progress || 0);

          return {
            id: existing?.id || `${type}-${today}`,
            ...config,
            progress: finalProgress,
            collected: existing?.collected || false,
          };
        });

        return missionsWithProgress;
      } catch (error) {
        console.error('Error in missions query:', error);
        // Retornar missões padrão mesmo com erro
        const missionTypes: MissionType[] = ['viral', 'resistencia', 'engajamento', 'apoio', 'conquistador'];
        return missionTypes.map((type) => ({
          id: `${type}-${today}`,
          ...MISSION_CONFIG[type],
          progress: 0,
          collected: false,
        }));
      }
    },
    enabled: !!user,
    staleTime: 10000, // Cache por 10 segundos
  });

  const initializeMissions = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      try {
        const missionTypes: MissionType[] = ['viral', 'resistencia', 'engajamento', 'apoio', 'conquistador'];

        for (const type of missionTypes) {
          const config = MISSION_CONFIG[type];
          
          // Calcular progresso inicial baseado nas conquistas
          let initialProgress = 0;
          if (type === 'resistencia') {
            initialProgress = Math.min(todayStats.totalKm, config.target);
          } else if (type === 'conquistador') {
            initialProgress = Math.min(todayStats.conquestCount, config.target);
          }
          
          await supabase
            .from('user_missions_daily')
            .upsert({
              user_id: user.id,
              mission_date: today,
              mission_type: type,
              progress: initialProgress,
              target: config.target,
              xp_reward: config.xpReward,
              collected: false,
            }, {
              onConflict: 'user_id,mission_date,mission_type',
            });
        }
      } catch (error) {
        console.error('Error initializing missions:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-missions', user?.id, today] });
    },
    onError: (error) => {
      console.error('Error in initializeMissions:', error);
    },
  });

  const updateMissionProgress = useMutation({
    mutationFn: async ({ type, increment = 1 }: { type: MissionType; increment?: number }) => {
      if (!user) throw new Error('Not authenticated');

      try {
        const config = MISSION_CONFIG[type];

        // Buscar missão existente
        const { data: existing } = await supabase
          .from('user_missions_daily')
          .select('*')
          .eq('user_id', user.id)
          .eq('mission_date', today)
          .eq('mission_type', type)
          .maybeSingle();

        if (existing) {
          // Não atualizar se já foi coletada
          if (existing.collected) return;

          const newProgress = Math.min((existing.progress || 0) + (increment || 0), config.target);
          await supabase
            .from('user_missions_daily')
            .update({ progress: newProgress })
            .eq('id', existing.id);
        } else {
          // Criar nova entrada
          await supabase
            .from('user_missions_daily')
            .insert({
              user_id: user.id,
              mission_date: today,
              mission_type: type,
              progress: Math.min(increment || 0, config.target),
              target: config.target,
              xp_reward: config.xpReward,
              collected: false,
            });
        }
      } catch (error) {
        console.error('Error updating mission progress:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-missions', user?.id, today] });
    },
  });

  const collectMissionXP = useMutation({
    mutationFn: async (type: MissionType) => {
      if (!user) throw new Error('Not authenticated');

      try {
        const config = MISSION_CONFIG[type];

        // Buscar a missão
        const { data: mission, error: missionError } = await supabase
          .from('user_missions_daily')
          .select('*')
          .eq('user_id', user.id)
          .eq('mission_date', today)
          .eq('mission_type', type)
          .maybeSingle();

        if (missionError) {
          console.error('Error fetching mission:', missionError);
          throw missionError;
        }
        
        if (!mission) {
          throw new Error('Missão não encontrada');
        }
        
        if (mission.collected) {
          throw new Error('Recompensa já foi coletada');
        }
        
        // Verificar se a missão está completa (usar progresso calculado se necessário)
        let currentProgress = mission.progress || 0;
        
        // Recalcular progresso para missões baseadas em conquistas
        if (type === 'resistencia') {
          currentProgress = Math.min(todayStats.totalKm, config.target);
        } else if (type === 'conquistador') {
          currentProgress = Math.min(todayStats.conquestCount, config.target);
        }
        
        if (currentProgress < config.target) {
          throw new Error('Missão ainda não foi completada');
        }

        // Marcar como coletada
        const { error: updateError } = await supabase
          .from('user_missions_daily')
          .update({ 
            collected: true,
            progress: currentProgress, // Atualizar progresso também
          })
          .eq('id', mission.id);

        if (updateError) {
          console.error('Error updating mission:', updateError);
          throw updateError;
        }

        // Adicionar XP ao perfil
        const currentXP = Number(profile?.xp || 0);
        const newXP = currentXP + config.xpReward;
        const newLevel = Math.floor(newXP / 1000) + 1;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            xp: newXP,
            level: newLevel,
          })
          .eq('user_id', user.id);

        if (profileError) {
          console.error('Error updating profile XP:', profileError);
          throw profileError;
        }

        return config.xpReward;
      } catch (error) {
        console.error('Error collecting mission XP:', error);
        throw error;
      }
    },
    onSuccess: (xpGained) => {
      queryClient.invalidateQueries({ queryKey: ['daily-missions', user?.id, today] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['today-conquests', user?.id, today] });
      toast.success(`+${xpGained} XP coletado!`, {
        icon: '⭐',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao coletar XP';
      toast.error(errorMessage);
      console.error('Error in collectMissionXP:', error);
    },
  });

  // Calcular progresso do nível
  const currentXP = Number(profile?.xp || 0);
  const currentLevel = Number(profile?.level || 1);
  const xpForCurrentLevel = (currentLevel - 1) * 1000;
  const xpForNextLevel = currentLevel * 1000;
  const xpProgress = currentXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const levelProgress = xpNeeded > 0 ? Math.min((xpProgress / xpNeeded) * 100, 100) : 100;

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
