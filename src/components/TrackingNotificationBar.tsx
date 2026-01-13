import { motion } from 'framer-motion';
import { Flame, Clock, MapPin, Gauge } from 'lucide-react';

interface TrackingNotificationBarProps {
  pace: number; // min/km
  distance: number; // meters
  duration: number; // seconds
  isVisible: boolean;
}

export function TrackingNotificationBar({
  pace,
  distance,
  duration,
  isVisible,
}: TrackingNotificationBarProps) {
  const formatPace = (p: number) => {
    if (p <= 0 || !isFinite(p)) return "--'--\"";
    const mins = Math.floor(p);
    const secs = Math.round((p - mins) * 60);
    return `${mins}'${secs.toString().padStart(2, '0')}"`;
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(2);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-50 safe-top"
    >
      <div className="bg-background/95 backdrop-blur-xl border-b border-primary/30 shadow-[0_4px_20px_rgba(255,79,0,0.2)]">
        {/* Header strip */}
        <div className="bg-gradient-neon h-1" />
        
        <div className="px-4 py-3">
          {/* Title */}
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-primary">
              ZONNA COMMAND CENTER
            </span>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Pace */}
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase">Pace</p>
                <p className="text-lg font-mono-display font-bold text-foreground">
                  {formatPace(pace)}
                  <span className="text-xs text-muted-foreground ml-1">/km</span>
                </p>
              </div>
            </div>

            {/* Distance */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase">Distância</p>
                <p className="text-lg font-mono-display font-bold text-primary">
                  {formatDistance(distance)}
                  <span className="text-xs ml-1">km</span>
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase">Tempo</p>
                <p className="text-lg font-mono-display font-bold text-foreground">
                  {formatTime(duration)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
