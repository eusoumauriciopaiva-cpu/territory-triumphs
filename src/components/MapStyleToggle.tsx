import { Moon, Satellite } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import type { MapStyleType } from '@/lib/mapStyle';

interface MapStyleToggleProps {
  currentStyle: MapStyleType;
  onStyleChange: (style: MapStyleType) => void;
  className?: string;
}

export function MapStyleToggle({ currentStyle, onStyleChange, className }: MapStyleToggleProps) {
  const toggleStyle = () => {
    onStyleChange(currentStyle === 'dark' ? 'satellite' : 'dark');
  };

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={toggleStyle}
      className={cn(
        "glass border border-border rounded-full w-12 h-12 transition-all",
        currentStyle === 'satellite' && "bg-primary/20 border-primary/50",
        className
      )}
      title={currentStyle === 'dark' ? 'Mudar para Satélite' : 'Mudar para Dark Treino'}
    >
      {currentStyle === 'dark' ? (
        <Satellite className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5 text-primary" />
      )}
    </Button>
  );
}
