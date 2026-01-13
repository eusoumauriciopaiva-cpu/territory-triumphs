import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { cn } from '@/lib/utils';

interface DominateButtonProps {
  isEnabled: boolean;
  distance: number;
  minDistance: number;
  onDominate: () => void;
}

export function DominateButton({
  isEnabled,
  distance,
  minDistance,
  onDominate,
}: DominateButtonProps) {
  const [hasTriggeredAlert, setHasTriggeredAlert] = useState(false);
  const progress = Math.min(100, (distance / minDistance) * 100);

  // Trigger vibration when enabled
  useEffect(() => {
    if (isEnabled && !hasTriggeredAlert) {
      setHasTriggeredAlert(true);
      
      if (Capacitor.isNativePlatform()) {
        Haptics.impact({ style: ImpactStyle.Heavy });
      }
      
      // Play sound on web
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }
    }
  }, [isEnabled, hasTriggeredAlert]);

  // Reset alert flag when tracking stops
  useEffect(() => {
    if (distance === 0) {
      setHasTriggeredAlert(false);
    }
  }, [distance]);

  const handleClick = async () => {
    if (!isEnabled) return;
    
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
    
    onDominate();
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {isEnabled ? (
          <motion.div
            key="enabled"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative"
          >
            {/* Pulsing glow effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-primary/50"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            
            <Button
              onClick={handleClick}
              className={cn(
                'relative w-full py-6 rounded-2xl font-black uppercase tracking-widest',
                'bg-gradient-to-r from-primary via-yellow-500 to-primary bg-[length:200%_100%]',
                'animate-[shimmer_2s_linear_infinite]',
                'shadow-[0_0_30px_rgba(255,79,0,0.6)]',
                'border-2 border-primary/50'
              )}
            >
              <motion.div
                className="flex items-center gap-3"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Target className="w-6 h-6" />
                <span className="text-lg">DOMINAR ÁREA</span>
                <Zap className="w-5 h-5" />
              </motion.div>
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="disabled"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Button
              disabled
              className="w-full py-6 rounded-2xl font-bold uppercase tracking-wider opacity-50"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="w-5 h-5" />
                  <span>DOMINAR ÁREA</span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary/50 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                
                <span className="text-[10px] text-muted-foreground">
                  {Math.round(distance)}m / {minDistance}m
                </span>
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
