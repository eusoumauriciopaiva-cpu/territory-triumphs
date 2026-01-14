import { useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

// Available trail colors - all free to choose
export const TRAIL_COLORS = [
  { id: 'orange', hex: '#FF4500', name: 'Laranja ZONNA' },
  { id: 'neon-green', hex: '#39FF14', name: 'Verde Neon' },
  { id: 'electric-blue', hex: '#00BFFF', name: 'Azul Elétrico' },
  { id: 'hot-pink', hex: '#FF1493', name: 'Rosa Choque' },
  { id: 'purple', hex: '#8B5CF6', name: 'Roxo' },
  { id: 'cyan', hex: '#00FFFF', name: 'Ciano' },
  { id: 'magenta', hex: '#FF00FF', name: 'Magenta' },
  { id: 'gold', hex: '#FFD700', name: 'Dourado' },
  { id: 'lime', hex: '#32CD32', name: 'Verde Lima' },
  { id: 'red', hex: '#FF0044', name: 'Vermelho' },
  { id: 'aqua', hex: '#7FFFD4', name: 'Água Marinha' },
  { id: 'white', hex: '#FFFFFF', name: 'Branco Puro' },
];

interface TrailColorSelectorProps {
  currentColor: string;
  onSelectColor: (color: string) => void;
}

export function TrailColorSelector({
  currentColor,
  onSelectColor,
}: TrailColorSelectorProps) {
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-primary" />
        <h3 className="font-black text-sm uppercase tracking-widest">Sua Cor</h3>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Escolha a cor do seu rastro, polígono de conquista e destaque no feed.
      </p>

      {/* Color Grid */}
      <div className="grid grid-cols-4 gap-3">
        {TRAIL_COLORS.map((color) => {
          const isSelected = currentColor === color.hex;

          return (
            <button
              key={color.id}
              onClick={() => onSelectColor(color.hex)}
              onMouseEnter={() => setHoveredColor(color.id)}
              onMouseLeave={() => setHoveredColor(null)}
              className={cn(
                'relative aspect-square rounded-xl transition-all duration-200',
                'flex items-center justify-center',
                'hover:scale-110 cursor-pointer',
                isSelected && 'ring-2 ring-offset-2 ring-offset-background ring-primary'
              )}
              style={{ 
                backgroundColor: color.hex,
                boxShadow: `0 0 20px ${color.hex}40`,
              }}
            >
              {isSelected && (
                <Check className="w-5 h-5 text-black drop-shadow-lg" />
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
            
            return (
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="font-bold text-sm">{color.name}</span>
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
