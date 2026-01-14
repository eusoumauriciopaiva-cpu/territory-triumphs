import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useDailyMissions, Mission } from '@/hooks/useDailyMissions';

interface MissionCardProps {
  mission: Mission;
  onCollect: () => void;
  isCollecting: boolean;
}

function MissionCard({ mission, onCollect, isCollecting }: MissionCardProps) {
  const isComplete = mission.progress >= mission.target;
  const progressPercent = (mission.progress / mission.target) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50"
    >
      {/* Icon */}
      <div className="text-2xl flex-shrink-0">{mission.icon}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-foreground">{mission.name}</span>
          <span className="text-xs text-primary font-bold">+{mission.xpReward} XP</span>
        </div>
        <p className="text-xs text-muted-foreground mb-2 truncate">{mission.description}</p>
        
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <Progress value={progressPercent} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground font-medium">
            {mission.progress}/{mission.target}
          </span>
        </div>
      </div>

      {/* Collect button */}
      <div className="flex-shrink-0">
        {mission.collected ? (
          <Button
            size="sm"
            variant="outline"
            disabled
            className="text-xs px-3 bg-green-500/20 border-green-500/50 text-green-400"
          >
            <Check className="w-3 h-3 mr-1" />
            Coletado
          </Button>
        ) : (
          <Button
            size="sm"
            variant={isComplete ? "default" : "outline"}
            disabled={!isComplete || isCollecting}
            onClick={onCollect}
            className={`text-xs px-3 ${isComplete ? 'bg-primary hover:bg-primary/90' : ''}`}
          >
            {isCollecting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <Gift className="w-3 h-3 mr-1" />
                Coletar
              </>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export function DailyMissions() {
  const {
    missions,
    isLoading,
    initializeMissions,
    collectMissionXP,
    currentLevel,
    xpProgress,
    xpNeeded,
    levelProgress,
  } = useDailyMissions();

  // Initialize missions on mount
  useEffect(() => {
    if (missions.length === 0 && !isLoading) {
      initializeMissions.mutate();
    }
  }, [missions.length, isLoading]);

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const totalXPAvailable = missions.reduce((acc, m) => acc + (m.collected ? 0 : m.xpReward), 0);
  const completedMissions = missions.filter(m => m.collected).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 p-4 rounded-xl bg-gradient-to-b from-card to-background border border-border/50"
    >
      {/* Header with Level Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            🎯 Missões Diárias
          </h3>
          <span className="text-xs text-muted-foreground">
            {completedMissions}/{missions.length} completas
          </span>
        </div>

        {/* Level bar */}
        <div className="bg-card/80 rounded-lg p-3 border border-border/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">⭐</span>
              <span className="font-bold text-foreground">Nível {currentLevel}</span>
            </div>
            <span className="text-xs text-primary font-semibold">
              +{totalXPAvailable} XP disponível
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={levelProgress} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground font-medium min-w-[60px] text-right">
              {xpProgress}/{xpNeeded} XP
            </span>
          </div>
        </div>
      </div>

      {/* Missions List */}
      <div className="space-y-2">
        {missions.map((mission) => (
          <MissionCard
            key={mission.type}
            mission={mission}
            onCollect={() => collectMissionXP.mutate(mission.type)}
            isCollecting={collectMissionXP.isPending}
          />
        ))}
      </div>

      {/* Reset info */}
      <p className="text-xs text-muted-foreground text-center mt-4">
        Missões resetam à meia-noite 🌙
      </p>
    </motion.div>
  );
}
