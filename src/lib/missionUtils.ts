import { supabase } from '@/integrations/supabase/client';

type MissionType = 'viral' | 'resistencia' | 'engajamento' | 'apoio' | 'conquistador';

const MISSION_TARGETS: Record<MissionType, { target: number; xpReward: number }> = {
  viral: { target: 1, xpReward: 200 },
  resistencia: { target: 1, xpReward: 150 },
  engajamento: { target: 2, xpReward: 50 },
  apoio: { target: 3, xpReward: 30 },
  conquistador: { target: 1, xpReward: 100 },
};

const getTodayDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export async function updateMissionProgress(
  userId: string, 
  type: MissionType, 
  increment: number = 1
): Promise<void> {
  const today = getTodayDate();
  const config = MISSION_TARGETS[type];

  try {
    // Check if mission exists for today
    const { data: existing } = await supabase
      .from('user_missions_daily')
      .select('*')
      .eq('user_id', userId)
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
          user_id: userId,
          mission_date: today,
          mission_type: type,
          progress: Math.min(increment, config.target),
          target: config.target,
          xp_reward: config.xpReward,
          collected: false,
        });
    }
  } catch (error) {
    console.error('Error updating mission progress:', error);
  }
}
