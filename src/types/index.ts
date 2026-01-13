export type AppRank = 
  | 'bronze' 
  | 'silver' 
  | 'gold' 
  | 'platinum' 
  | 'diamond' 
  | 'master' 
  | 'grandmaster' 
  | 'emperor';

export type RecordMode = 'livre' | 'dominio';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  total_area: number;
  total_km: number;
  rank: AppRank;
  current_streak: number;
  best_streak: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conquest {
  id: string;
  user_id: string;
  path: [number, number][];
  area: number;
  distance: number;
  created_at: string;
  profile?: Profile;
}

export interface Group {
  id: string;
  name: string;
  created_by: string | null;
  total_area: number;
  created_at: string;
  member_count?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  profile?: Profile;
}

export const RANK_CONFIG: Record<AppRank, { 
  label: string; 
  minXp: number; 
  color: string;
  icon: string;
}> = {
  bronze: { label: 'Bronze', minXp: 0, color: 'rank-bronze', icon: '🥉' },
  silver: { label: 'Prata', minXp: 500, color: 'rank-silver', icon: '🥈' },
  gold: { label: 'Ouro', minXp: 1000, color: 'rank-gold', icon: '🥇' },
  platinum: { label: 'Platina', minXp: 2500, color: 'rank-platinum', icon: '💎' },
  diamond: { label: 'Diamante', minXp: 5000, color: 'rank-diamond', icon: '💠' },
  master: { label: 'Mestre', minXp: 10000, color: 'rank-master', icon: '👑' },
  grandmaster: { label: 'Grão-Mestre', minXp: 25000, color: 'rank-grandmaster', icon: '🔥' },
  emperor: { label: 'Imperador', minXp: 50000, color: 'rank-emperor', icon: '⚡' },
};

export const getNextRank = (currentRank: AppRank): AppRank | null => {
  const ranks: AppRank[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster', 'emperor'];
  const currentIndex = ranks.indexOf(currentRank);
  return currentIndex < ranks.length - 1 ? ranks[currentIndex + 1] : null;
};

export const getXpForNextRank = (currentRank: AppRank): number => {
  const nextRank = getNextRank(currentRank);
  return nextRank ? RANK_CONFIG[nextRank].minXp : RANK_CONFIG.emperor.minXp;
};
