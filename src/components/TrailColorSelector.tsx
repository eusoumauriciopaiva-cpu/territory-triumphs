import { useState } from 'react';
import { Check, Lock, Palette, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

// Available trail colors with unlock requirements
export const TRAIL_COLORS = [
  { id: 'orange', hex: '#FF4F00', name: 'Laranja ZONNA', unlockLevel: 0, unlockXP: 0 },
  { id: 'green', hex: '#00FF87', name: 'Verde Neon', unlockLevel: 5, unlockXP: 500 },
  { id: 'cyan', hex: '#00FFFF', name: 'Ciano', unlockLevel: 10, unlockXP: 1000 },
  { id: 'magenta', hex: '#FF00FF', name: 'Magenta', unlockLevel: 15, unlockXP: 2500 },
  { id: 'gold', hex: '#FFD700', name: 'Dourado', unlockLevel: 20, unlockXP: 5000 },
  { id: 'purple', hex: '#8B5CF6', name: 'Violeta', unlockLevel: 25, unlockXP: 7500 },
  { id: 'red', hex: '#FF0044', name: 'Vermelho', unlockLevel: 30, unlockXP: 10000 },
  { id: 'white', hex: '#FFFFFF', name: 'Branco Puro', unlockLevel: 50, unlockXP: 25000 },
];

interface TrailColorSelectorProps {
  profile: Profile;
  currentColor: string;
  unlockedColors: string[];
  onSelectColor: (color: string) => void;
}

export function TrailColorSelector({
  profile,
  currentColor,
  unlockedColors,
  onSelectColor,
}: TrailColorSelectorProps) {
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  const isColorUnlocked = (color: typeof TRAIL_COLORS[0]) => {
    return profile.xp >= color.unlockXP || unlockedColors.includes(color.hex);
  };

  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-primary" />
        <h3 className="font-black text-sm uppercase tracking-widest">Assinatura Visual</h3>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Personalize a cor do seu rastro no mapa e no compartilhamento.
      </p>

      {/* Color Grid */}
      <div className="grid grid-cols-4 gap-3">
        {TRAIL_COLORS.map((color) => {
          const unlocked = isColorUnlocked(color);
          const isSelected = currentColor === color.hex;

          return (
            <button
              key={color.id}
              onClick={() => unlocked && onSelectColor(color.hex)}
              onMouseEnter={() => setHoveredColor(color.id)}
              onMouseLeave={() => setHoveredColor(null)}
              disabled={!unlocked}
              className={cn(
                'relative aspect-square rounded-xl transition-all duration-200',
                'flex items-center justify-center',
                unlocked 
                  ? 'hover:scale-110 cursor-pointer' 
                  : 'cursor-not-allowed opacity-50',
                isSelected && 'ring-2 ring-offset-2 ring-offset-background ring-primary'
              )}
              style={{ 
                backgroundColor: color.hex,
                boxShadow: unlocked ? `0 0 20px ${color.hex}40` : 'none',
              }}
            >
              {isSelected && (
                <Check className="w-5 h-5 text-black drop-shadow-lg" />
              )}
              {!unlocked && (
                <Lock className="w-4 h-4 text-white/80" />
              )}
            </button>
          );
        })}
      </div>

      {/* Hovered Color Info */}
      {hoveredColor && (
        <div className="mt-4 p-3 bg-muted rounded-xl">
          {(() => {
            const color = TRAIL_COLORS.find(c => c.id === hoveredColor);
            if (!color) return null;
            const unlocked = isColorUnlocked(color);
            
            return (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="font-bold text-sm">{color.name}</span>
                </div>
                {unlocked ? (
                  <span className="text-xs text-primary font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Desbloqueado
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {color.unlockXP.toLocaleString()} XP
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Current Selection Preview */}
      <div className="mt-4 p-3 rounded-xl border border-border bg-background">
        <p className="text-xs text-muted-foreground mb-2">Prévia do rastro:</p>
        <div className="h-2 rounded-full overflow-hidden bg-muted">
          <div 
            className="h-full w-2/3 rounded-full transition-colors duration-300"
            style={{ 
              backgroundColor: currentColor,
              boxShadow: `0 0 10px ${currentColor}`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
