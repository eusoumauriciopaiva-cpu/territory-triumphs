import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Check, 
  Trophy, 
  Flame, 
  Target, 
  Crown, 
  Zap,
  Star,
  Sparkles,
  ChevronRight,
  Medal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile, Conquest } from '@/types';

// Codex Colors with unlock requirements
export const CODEX_COLORS = [
  { 
    id: 'orange', 
    hex: '#FF4F00', 
    name: 'Laranja Invasor', 
    description: 'Sua assinatura padrão',
    icon: Flame,
    unlockType: 'default' as const,
    requirement: null,
  },
  { 
    id: 'blue', 
    hex: '#00BFFF', 
    name: 'Azul Criogênico', 
    description: 'Domine 10 territórios',
    icon: Target,
    unlockType: 'conquests' as const,
    requirement: 10,
  },
  { 
    id: 'green', 
    hex: '#00FF87', 
    name: 'Verde Radioativo', 
    description: 'Corra 50km em um único mês',
    icon: Zap,
    unlockType: 'monthly_km' as const,
    requirement: 50,
  },
  { 
    id: 'purple', 
    hex: '#A855F7', 
    name: 'Roxo Sombrio', 
    description: 'Alcance 5.000 XP',
    icon: Star,
    unlockType: 'xp' as const,
    requirement: 5000,
  },
  { 
    id: 'cyan', 
    hex: '#00FFFF', 
    name: 'Ciano Elétrico', 
    description: 'Mantenha 7 dias de streak',
    icon: Flame,
    unlockType: 'streak' as const,
    requirement: 7,
  },
  { 
    id: 'magenta', 
    hex: '#FF00FF', 
    name: 'Magenta Plasma', 
    description: 'Conquiste 100.000 m²',
    icon: Target,
    unlockType: 'total_area' as const,
    requirement: 100000,
  },
  { 
    id: 'gold', 
    hex: '#FFD700', 
    name: 'Dourado Imperial', 
    description: 'Alcance o Top 1 do Ranking Global',
    icon: Crown,
    unlockType: 'rank_1' as const,
    requirement: 1,
  },
  { 
    id: 'white', 
    hex: '#FFFFFF', 
    name: 'Branco Absoluto', 
    description: 'Alcance o rank Imperador',
    icon: Crown,
    unlockType: 'emperor' as const,
    requirement: 'emperor',
  },
];

interface ZonnaCodexProps {
  profile: Profile & { trail_color?: string; unlocked_colors?: string[] };
  conquests: Conquest[];
  currentColor: string;
  onSelectColor: (color: string) => void;
}

export function ZonnaCodex({
  profile,
  conquests,
  currentColor,
  onSelectColor,
}: ZonnaCodexProps) {
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const unlockedColors = profile.unlocked_colors || ['#FF4F00'];

  // Check if a color is unlocked based on requirements
  const isColorUnlocked = (color: typeof CODEX_COLORS[0]): boolean => {
    if (color.unlockType === 'default') return true;
    if (unlockedColors.includes(color.hex)) return true;

    switch (color.unlockType) {
      case 'conquests':
        return conquests.length >= (color.requirement as number);
      case 'xp':
        return profile.xp >= (color.requirement as number);
      case 'streak':
        return (profile.best_streak || 0) >= (color.requirement as number);
      case 'total_area':
        return profile.total_area >= (color.requirement as number);
      case 'monthly_km':
        // Calculate current month km
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyKm = conquests
          .filter(c => new Date(c.created_at) >= monthStart)
          .reduce((sum, c) => sum + Number(c.distance), 0);
        return monthlyKm >= (color.requirement as number);
      case 'rank_1':
        return false; // This would require ranking data
      case 'emperor':
        return profile.rank === 'emperor';
      default:
        return false;
    }
  };

  // Calculate progress for a color
  const getProgress = (color: typeof CODEX_COLORS[0]): number => {
    if (isColorUnlocked(color)) return 100;

    switch (color.unlockType) {
      case 'conquests':
        return Math.min(100, (conquests.length / (color.requirement as number)) * 100);
      case 'xp':
        return Math.min(100, (profile.xp / (color.requirement as number)) * 100);
      case 'streak':
        return Math.min(100, ((profile.best_streak || 0) / (color.requirement as number)) * 100);
      case 'total_area':
        return Math.min(100, (profile.total_area / (color.requirement as number)) * 100);
      case 'monthly_km': {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyKm = conquests
          .filter(c => new Date(c.created_at) >= monthStart)
          .reduce((sum, c) => sum + Number(c.distance), 0);
        return Math.min(100, (monthlyKm / (color.requirement as number)) * 100);
      }
      default:
        return 0;
    }
  };

  const handleSelectColor = (color: typeof CODEX_COLORS[0]) => {
    if (isColorUnlocked(color)) {
      onSelectColor(color.hex);
      setSelectedColorId(null);
    } else {
      setSelectedColorId(color.id);
    }
  };

  return (
    <div className="bg-card rounded-3xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Medal className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-black text-lg uppercase tracking-wider">ZONNA Codex</h3>
            <p className="text-xs text-muted-foreground">Arsenal de Cores</p>
          </div>
        </div>
      </div>

      {/* Colors List */}
      <div className="divide-y divide-border">
        {CODEX_COLORS.map((color) => {
          const unlocked = isColorUnlocked(color);
          const progress = getProgress(color);
          const isSelected = currentColor === color.hex;
          const isExpanded = selectedColorId === color.id;
          const Icon = color.icon;

          return (
            <motion.div
              key={color.id}
              layout
              className="relative"
            >
              <button
                onClick={() => handleSelectColor(color)}
                className={cn(
                  'w-full p-4 flex items-center gap-4 transition-colors',
                  unlocked ? 'hover:bg-muted/50' : 'opacity-70',
                  isSelected && 'bg-primary/10'
                )}
              >
                {/* Color Indicator */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                    unlocked ? 'shadow-lg' : 'grayscale'
                  )}
                  style={{
                    backgroundColor: unlocked ? color.hex : '#333333',
                    boxShadow: unlocked ? `0 0 20px ${color.hex}40` : 'none',
                  }}
                >
                  {unlocked ? (
                    isSelected ? (
                      <Check className="w-6 h-6 text-black drop-shadow" />
                    ) : (
                      <Icon className="w-5 h-5 text-black/80" />
                    )
                  ) : (
                    <Lock className="w-5 h-5 text-white/60" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'font-bold',
                      unlocked ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {color.name}
                    </span>
                    {unlocked && (
                      <Sparkles className="w-3 h-3 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {color.description}
                  </p>
                  
                  {/* Progress bar for locked colors */}
                  {!unlocked && progress > 0 && (
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-primary/60 rounded-full"
                      />
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight className={cn(
                  'w-5 h-5 text-muted-foreground transition-transform',
                  isExpanded && 'rotate-90'
                )} />
              </button>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && !unlocked && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-muted/30"
                  >
                    <div className="p-4 border-t border-border">
                      <div className="flex items-center gap-3 mb-3">
                        <Trophy className="w-5 h-5 text-primary" />
                        <span className="text-sm font-bold">Como desbloquear:</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {color.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progresso:</span>
                        <span className="font-mono-stats font-bold text-primary">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Current Selection */}
      <div className="p-4 bg-muted/30 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">Cor ativa:</p>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg"
            style={{
              backgroundColor: currentColor,
              boxShadow: `0 0 15px ${currentColor}60`,
            }}
          />
          <span className="font-bold text-sm">
            {CODEX_COLORS.find(c => c.hex === currentColor)?.name || 'Personalizada'}
          </span>
        </div>
      </div>
    </div>
  );
}
