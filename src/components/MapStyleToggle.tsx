import { Map, Satellite } from 'lucide-react';
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
    onStyleChange(currentStyle === 'standard' ? 'satellite' : 'standard');
  };

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={toggleStyle}
      className={cn(
        "bg-black/90 hover:bg-black border border-white/20 rounded-full w-12 h-12 transition-all shadow-xl",
        className
      )}
      title={currentStyle === 'standard' ? 'Mudar para Satélite' : 'Mudar para Mapa'}
    >
      {currentStyle === 'standard' ? (
        <Satellite className="w-5 h-5 text-white" />
      ) : (
        <Map className="w-5 h-5 text-white" />
      )}
    </Button>
  );
}
