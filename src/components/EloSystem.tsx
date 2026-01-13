import { motion } from 'framer-motion';
import { Flame, Crown, Shield, Star, Diamond, Zap, Award, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppRank, Profile } from '@/types';
import { RANK_CONFIG, getNextRank } from '@/types';

interface EloBadgeProps {
  rank: AppRank;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  animated?: boolean;
}

const RANK_ICONS: Record<AppRank, React.ElementType> = {
  bronze: Shield,
  silver: Shield,
  gold: Star,
  platinum: Diamond,
  diamond: Diamond,
  master: Crown,
  grandmaster: Trophy,
  emperor: Flame,
};

const RANK_COLORS: Record<AppRank, { bg: string; text: string; glow: string }> = {
  bronze: { 
    bg: 'bg-gradient-to-br from-amber-700 to-amber-900', 
    text: 'text-amber-200',
    glow: 'shadow-amber-500/30'
  },
  silver: { 
    bg: 'bg-gradient-to-br from-gray-300 to-gray-500', 
    text: 'text-gray-800',
    glow: 'shadow-gray-400/30'
  },
  gold: { 
    bg: 'bg-gradient-to-br from-yellow-400 to-amber-600', 
    text: 'text-yellow-900',
    glow: 'shadow-yellow-400/40'
  },
  platinum: { 
    bg: 'bg-gradient-to-br from-cyan-200 to-cyan-500', 
    text: 'text-cyan-900',
    glow: 'shadow-cyan-400/40'
  },
  diamond: { 
    bg: 'bg-gradient-to-br from-blue-300 to-blue-600', 
    text: 'text-blue-100',
    glow: 'shadow-blue-400/50'
  },
  master: { 
    bg: 'bg-gradient-to-br from-purple-400 to-purple-700', 
    text: 'text-purple-100',
    glow: 'shadow-purple-500/50'
  },
  grandmaster: { 
    bg: 'bg-gradient-to-br from-pink-400 to-rose-600', 
    text: 'text-pink-100',
    glow: 'shadow-rose-500/50'
  },
  emperor: { 
    bg: 'bg-gradient-to-br from-orange-500 to-red-600', 
    text: 'text-orange-100',
    glow: 'shadow-orange-500/60'
  },
};

const SIZES = {
  sm: { badge: 'w-6 h-6', icon: 'w-3 h-3', text: 'text-[10px]' },
  md: { badge: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-xs' },
  lg: { badge: 'w-14 h-14', icon: 'w-7 h-7', text: 'text-sm' },
  xl: { badge: 'w-20 h-20', icon: 'w-10 h-10', text: 'text-base' },
};

export function EloBadge({ rank, size = 'md', showLabel = true, animated = true }: EloBadgeProps) {
  const Icon = RANK_ICONS[rank];
  const colors = RANK_COLORS[rank];
  const sizeConfig = SIZES[size];
  const config = RANK_CONFIG[rank];

  return (
    <div className="flex items-center gap-2">
      <motion.div
        initial={animated ? { scale: 0 } : false}
        animate={{ scale: 1 }}
        className={cn(
          'rounded-xl flex items-center justify-center shadow-lg',
          colors.bg,
          colors.glow,
          sizeConfig.badge,
          animated && rank === 'emperor' && 'animate-pulse-zonna'
        )}
      >
        <Icon className={cn(sizeConfig.icon, colors.text)} />
      </motion.div>
      
      {showLabel && (
        <span className={cn('font-bold uppercase tracking-wider', sizeConfig.text, 'text-foreground')}>
          {config.label}
        </span>
      )}
    </div>
  );
}

interface XPProgressBarProps {
  profile: Profile;
  showDetails?: boolean;
}

export function XPProgressBar({ profile, showDetails = true }: XPProgressBarProps) {
  const currentRankConfig = RANK_CONFIG[profile.rank];
  const nextRank = getNextRank(profile.rank);
  const nextRankConfig = nextRank ? RANK_CONFIG[nextRank] : null;
  
  const currentMinXp = currentRankConfig.minXp;
  const nextMinXp = nextRankConfig?.minXp || currentMinXp;
  const xpInCurrentRank = profile.xp - currentMinXp;
  const xpNeededForNext = nextMinXp - currentMinXp;
  const progress = nextRankConfig 
    ? Math.min((xpInCurrentRank / xpNeededForNext) * 100, 100)
    : 100;

  return (
    <div className="space-y-2">
      {showDetails && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">
            {profile.xp.toLocaleString()} XP
          </span>
          {nextRankConfig && (
            <span className="text-muted-foreground">
              {(nextMinXp - profile.xp).toLocaleString()} até {nextRankConfig.label}
            </span>
          )}
        </div>
      )}
      
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full bg-gradient-zonna rounded-full relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" 
               style={{ backgroundSize: '200% 100%' }} />
        </motion.div>
      </div>
    </div>
  );
}

interface StreakBadgeProps {
  streak: number;
  bestStreak?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakBadge({ streak, bestStreak, size = 'md' }: StreakBadgeProps) {
  const sizes = {
    sm: { container: 'px-2 py-1', icon: 'w-3 h-3', text: 'text-xs' },
    md: { container: 'px-3 py-1.5', icon: 'w-4 h-4', text: 'text-sm' },
    lg: { container: 'px-4 py-2', icon: 'w-5 h-5', text: 'text-base' },
  };

  const s = sizes[size];
  const isActive = streak > 0;
  const hasBonus = streak >= 3;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'flex items-center gap-1.5 rounded-full font-bold',
        s.container,
        isActive 
          ? hasBonus 
            ? 'bg-gradient-zonna text-primary-foreground glow-zonna' 
            : 'bg-orange-500/20 text-orange-400'
          : 'bg-muted text-muted-foreground'
      )}
    >
      <Flame className={cn(s.icon, hasBonus && 'animate-pulse')} />
      <span className={s.text}>{streak}</span>
      {hasBonus && (
        <span className={cn('opacity-75', s.text)}>
          (+{Math.min(streak * 10, 50)}% XP)
        </span>
      )}
    </motion.div>
  );
}

interface EloCardProps {
  profile: Profile;
  compact?: boolean;
}

export function EloCard({ profile, compact = false }: EloCardProps) {
  return (
    <div className={cn(
      'bg-card border border-border rounded-2xl overflow-hidden',
      compact ? 'p-4' : 'p-6'
    )}>
      <div className="flex items-center gap-4 mb-4">
        <EloBadge rank={profile.rank} size={compact ? 'md' : 'lg'} showLabel={false} />
        <div className="flex-1">
          <h3 className="font-bold text-foreground">{profile.name}</h3>
          <p className="text-sm text-muted-foreground">
            Nível {profile.level} • {RANK_CONFIG[profile.rank].label}
          </p>
        </div>
        <StreakBadge streak={profile.current_streak} size={compact ? 'sm' : 'md'} />
      </div>
      
      <XPProgressBar profile={profile} showDetails={!compact} />
      
      {!compact && (
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-mono-display font-bold text-foreground">
              {profile.total_km.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">KM Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-mono-display font-bold text-primary">
              {profile.total_area.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">m² Dominados</p>
          </div>
        </div>
      )}
    </div>
  );
}
