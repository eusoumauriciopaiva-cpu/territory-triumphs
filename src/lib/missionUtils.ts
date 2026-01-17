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
  return new Date().toISOString().split('T')[0];
};

// --- FUNÇÃO 1: ATUALIZAR O PROGRESSO (Quando ele faz a ação) ---
export async function updateMissionProgress(
  userId: string, 
  type: MissionType, 
  increment: number = 1
): Promise<void> {
  const today = getTodayDate();
  const config = MISSION_TARGETS[type];

  const { data: existing } = await supabase
    .from('user_missions_daily')
    .select('*')
    .eq('user_id', userId)
    .eq('mission_date', today)
    .eq('mission_type', type)
    .maybeSingle();

  if (existing) {
    if (existing.collected) return; // Se já coletou o prêmio, não faz nada
    const newProgress = Math.min(existing.progress + increment, config.target);
    await supabase.from('user_missions_daily').update({ progress: newProgress }).eq('id', existing.id);
  } else {
    await supabase.from('user_missions_daily').insert({
      user_id: userId,
      mission_date: today,
      mission_type: type,
      progress: Math.min(increment, config.target),
      target: config.target,
      xp_reward: config.xpReward,
      collected: false,
    });
  }
}

// --- FUNÇÃO 2: COLETAR O PRÊMIO (Quando ele clica no botão) ---
export async function claimMissionReward(
  userId: string,
  missionId: string,
  xpReward: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Marca como coletado
    const { error: missionError } = await supabase
      .from('user_missions_daily')
      .update({ collected: true })
      .eq('id', missionId)
      .eq('user_id', userId);

    if (missionError) throw missionError;

    // 2. Soma o XP no Perfil (Profiles)
    const { data: profile } = await supabase.from('profiles').select('xp').eq('user_id', userId).single();
    const currentXp = profile?.xp || 0;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ xp: currentXp + xpReward })
      .eq('user_id', userId);

    if (profileError) throw profileError;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}