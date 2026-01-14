import { TrailColorSelector } from './TrailColorSelector';

interface ZonnaCodexProps {
  currentColor: string;
  onSelectColor: (color: string) => void;
}

export function ZonnaCodex({
  currentColor,
  onSelectColor,
}: ZonnaCodexProps) {
  return (
    <TrailColorSelector
      currentColor={currentColor}
      onSelectColor={onSelectColor}
    />
  );
}
