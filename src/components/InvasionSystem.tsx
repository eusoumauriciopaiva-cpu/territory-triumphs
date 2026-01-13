import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Swords, X, Trophy, Flame } from 'lucide-react';
import { Button } from './ui/button';
import { EloBadge, XPProgressBar } from './EloSystem';
import { cn } from '@/lib/utils';
import type { Profile, Conquest } from '@/types';
import * as turf from '@turf/turf';

interface InvasionAlertProps {
  isVisible: boolean;
  ownerName: string;
  ownerProfile?: Profile;
  onDismiss: () => void;
  onChallenge: () => void;
}

export function InvasionAlert({ 
  isVisible, 
  ownerName, 
  ownerProfile,
  onDismiss, 
  onChallenge 
}: InvasionAlertProps) {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-4 left-4 right-4 z-[9000] safe-top"
      >
        <div className="bg-red-950/95 backdrop-blur-xl border-2 border-red-500 rounded-2xl p-4 glow-zonna shadow-2xl shadow-red-500/20">
          <div className="flex items-start gap-3">
            <div className="bg-red-500/20 p-2 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            
            <div className="flex-1">
              <p className="text-red-400 text-xs font-black uppercase tracking-widest mb-1">
                TERRITÓRIO INIMIGO
              </p>
              <p className="text-foreground font-bold">
                Domínio de <span className="text-red-400">{ownerName}</span>
              </p>
              
              {ownerProfile && (
                <div className="flex items-center gap-2 mt-2">
                  <EloBadge rank={ownerProfile.rank} size="sm" showLabel={false} />
                  <span className="text-xs text-muted-foreground">
                    {ownerProfile.total_area.toLocaleString()} m² dominados
                  </span>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground -mt-1 -mr-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={onDismiss}
              className="flex-1"
            >
              Ignorar
            </Button>
            <Button
              size="sm"
              onClick={onChallenge}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <Swords className="w-4 h-4 mr-1" />
              Iniciar Disputa
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

interface DuelPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile;
  opponent: Profile;
  currentUserConquests: Conquest[];
  opponentConquests: Conquest[];
}

export function DuelPanel({ 
  isOpen, 
  onClose, 
  currentUser, 
  opponent,
  currentUserConquests,
  opponentConquests
}: DuelPanelProps) {
  const [currentProgress, setCurrentProgress] = useState(0);
  const [opponentProgress, setOpponentProgress] = useState(0);

  // Calculate session progress (area conquered in last 24h)
  useEffect(() => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const currentRecent = currentUserConquests
      .filter(c => new Date(c.created_at) > oneDayAgo)
      .reduce((acc, c) => acc + c.area, 0);

    const opponentRecent = opponentConquests
      .filter(c => new Date(c.created_at) > oneDayAgo)
      .reduce((acc, c) => acc + c.area, 0);

    setCurrentProgress(currentRecent);
    setOpponentProgress(opponentRecent);
  }, [currentUserConquests, opponentConquests]);

  if (!isOpen) return null;

  const total = currentProgress + opponentProgress;
  const currentPercent = total > 0 ? (currentProgress / total) * 100 : 50;
  const isWinning = currentProgress > opponentProgress;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-24 left-4 right-4 z-[8000]"
    >
      <div className="glass-dark border border-primary/30 rounded-3xl p-4 glow-zonna">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-primary" />
            <span className="font-black uppercase tracking-wider text-sm">Modo Duelo</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Competitors */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Current User */}
          <div className={cn(
            "text-center p-3 rounded-xl border-2",
            isWinning ? "border-green-500 bg-green-500/10" : "border-border bg-card"
          )}>
            <EloBadge rank={currentUser.rank} size="sm" showLabel={false} />
            <p className="font-bold text-sm mt-2 truncate">{currentUser.name}</p>
            <p className="text-2xl font-mono-display font-bold text-primary">
              {currentProgress.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">m² hoje</p>
          </div>

          {/* Opponent */}
          <div className={cn(
            "text-center p-3 rounded-xl border-2",
            !isWinning && currentProgress !== opponentProgress 
              ? "border-red-500 bg-red-500/10" 
              : "border-border bg-card"
          )}>
            <EloBadge rank={opponent.rank} size="sm" showLabel={false} />
            <p className="font-bold text-sm mt-2 truncate">{opponent.name}</p>
            <p className="text-2xl font-mono-display font-bold text-red-400">
              {opponentProgress.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">m² hoje</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-muted rounded-full overflow-hidden flex">
          <motion.div
            initial={{ width: '50%' }}
            animate={{ width: `${currentPercent}%` }}
            className="h-full bg-gradient-zonna"
          />
          <motion.div
            initial={{ width: '50%' }}
            animate={{ width: `${100 - currentPercent}%` }}
            className="h-full bg-red-500"
          />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-2">
          Conquista nas últimas 24 horas
        </p>
      </div>
    </motion.div>
  );
}

// Utility function to check if a point is inside any enemy territory
export function checkInvasion(
  userPosition: [number, number],
  conquests: Conquest[],
  currentUserId: string,
  userGroupIds: string[]
): Conquest | null {
  const point = turf.point([userPosition[1], userPosition[0]]);

  for (const conquest of conquests) {
    // Skip own territories
    if (conquest.user_id === currentUserId) continue;

    // Skip if user is in same group (clan) - territories are shared in groups
    // This would require group membership check - for now we check all foreign territories

    try {
      const polygon = turf.polygon([conquest.path.map(([lat, lng]) => [lng, lat])]);
      if (turf.booleanPointInPolygon(point, polygon)) {
        return conquest;
      }
    } catch {
      // Invalid polygon, skip
    }
  }

  return null;
}
