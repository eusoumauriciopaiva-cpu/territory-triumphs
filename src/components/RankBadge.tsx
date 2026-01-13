import { cn } from '@/lib/utils';
import { RANK_CONFIG, type AppRank } from '@/types';

interface RankBadgeProps {
  rank: AppRank;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function RankBadge({ rank, size = 'md', showLabel = true }: RankBadgeProps) {
  const config = RANK_CONFIG[rank];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-bold tracking-tight",
      config.color,
      sizeClasses[size],
      rank === 'emperor' && 'animate-glow'
    )}>
      <span>{config.icon}</span>
      {showLabel && <span className="text-white drop-shadow-md">{config.label}</span>}
    </div>
  );
}

interface RankProgressProps {
  xp: number;
  rank: AppRank;
}

export function RankProgress({ xp, rank }: RankProgressProps) {
  const currentConfig = RANK_CONFIG[rank];
  const ranks: AppRank[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster', 'emperor'];
  const currentIndex = ranks.indexOf(rank);
  const nextRank = currentIndex < ranks.length - 1 ? ranks[currentIndex + 1] : null;
  
  if (!nextRank) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">XP Total</span>
          <span className="font-bold text-primary">{xp.toLocaleString()}</span>
        </div>
        <div className="text-center text-muted-foreground text-xs">
          ⚡ Elo Máximo Alcançado!
        </div>
      </div>
    );
  }

  const nextConfig = RANK_CONFIG[nextRank];
  const progress = ((xp - currentConfig.minXp) / (nextConfig.minXp - currentConfig.minXp)) * 100;
  const xpNeeded = nextConfig.minXp - xp;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <RankBadge rank={rank} size="sm" />
        <RankBadge rank={nextRank} size="sm" />
      </div>
      
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-neon rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{xp.toLocaleString()} XP</span>
        <span>Faltam {xpNeeded.toLocaleString()} XP</span>
      </div>
    </div>
  );
}
