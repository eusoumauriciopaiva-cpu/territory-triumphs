import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Square, Trophy, MapPin, AlertCircle, Flame, Target, Share2 } from 'lucide-react';
import { Button } from './ui/button';
import { ZonnaMap3D } from './ZonnaMap3D';
import { ZonnaSnapshot } from './ZonnaSnapshot';
import { TrackingNotificationBar } from './TrackingNotificationBar';
import { DominateButton } from './DominateButton';
import { MapStyleToggle } from './MapStyleToggle';
import { cn } from '@/lib/utils';
import * as turf from '@turf/turf';
import type { RecordMode } from '@/types';
import type { MapStyleType } from '@/lib/mapStyle';

interface RecordingDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (data: {
    path: [number, number][];
    area: number;
    distance: number;
    duration: number;
    mode: RecordMode;
  }) => void;
  conquestCount: number;
  trailColor?: string;
}

type GpsStatus = 'searching' | 'ok' | 'denied';

export function RecordingDashboard({ isOpen, onClose, onFinish, conquestCount, trailColor = '#FF4F00' }: RecordingDashboardProps) {
  const [mode, setMode] = useState<RecordMode>('livre');
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [path, setPath] = useState<[number, number][]>([]);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [startPos, setStartPos] = useState<[number, number] | null>(null);
  const [distance, setDistance] = useState(0);
  const [canClose, setCanClose] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('searching');
  const [showVictory, setShowVictory] = useState(false);
  const [victoryZoom, setVictoryZoom] = useState(false);
  const [lastStats, setLastStats] = useState({ area: 0, distance: 0, duration: 0, pace: 0 });
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [lastPath, setLastPath] = useState<[number, number][]>([]);
  const [mapStyle, setMapStyle] = useState<MapStyleType>('standard');

  const watchId = useRef<number | null>(null);

  // Check GPS permission
  useEffect(() => {
    if (!isOpen) return;
    
    navigator.permissions?.query({ name: 'geolocation' as PermissionName })
      .then((result) => {
        if (result.state === 'denied') setGpsStatus('denied');
      })
      .catch(() => {});
  }, [isOpen]);

  // GPS tracking
  useEffect(() => {
    if (!isOpen) return;

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(newPos);
        setGpsStatus('ok');

        if (isRecording) {
          if (!startPos) {
            setStartPos(newPos);
            setPath([newPos]);
          } else {
            setPath((prev) => {
              const newPath = [...prev, newPos];
              
              if (newPath.length > 1) {
                const line = turf.lineString(newPath.map((p) => [p[1], p[0]]));
                const length = turf.length(line, { units: 'kilometers' });
                setDistance(length);

                // Check if can close polygon (>100m traveled and within 20m of start)
                if (mode === 'dominio') {
                  const distToStart = turf.distance(
                    turf.point([newPos[1], newPos[0]]),
                    turf.point([startPos[1], startPos[0]]),
                    { units: 'meters' }
                  );

                  if (length > 0.1 && distToStart < 25) {
                    if (!canClose) {
                      setCanClose(true);
                      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
                    }
                  } else {
                    setCanClose(false);
                  }
                }
              }
              
              return newPath;
            });
          }
        }
      },
      (err) => {
        if (err.code === 1) setGpsStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [isOpen, isRecording, startPos, canClose, mode]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStart = useCallback(() => {
    setIsRecording(true);
    setSeconds(0);
    setPath(userPos ? [userPos] : []);
    setDistance(0);
    setStartPos(userPos);
    setCanClose(false);
  }, [userPos]);

  const handleStop = useCallback(() => {
    setIsRecording(false);
  }, []);

  const handleFinishDomain = useCallback(() => {
    if (path.length < 3) return;

    const polygonPath = [...path, path[0]];
    const turfPoly = turf.polygon([polygonPath.map((p) => [p[1], p[0]])]);
    const area = Math.round(turf.area(turfPoly));
    const pace = distance > 0 ? (seconds / 60) / distance : 0;

    setLastStats({ area, distance, duration: seconds, pace });
    setLastPath(polygonPath);
    setVictoryZoom(true);
    
    setTimeout(() => {
      setShowVictory(true);
      setIsRecording(false);
    }, 800);

    onFinish({
      path: polygonPath,
      area,
      distance,
      duration: seconds,
      mode,
    });
  }, [path, distance, seconds, mode, onFinish]);

  const handleFinishLivre = useCallback(() => {
    // For ZONNA LIVRE mode, calculate area from path bounds
    if (path.length < 2) return;

    const line = turf.lineString(path.map((p) => [p[1], p[0]]));
    const buffered = turf.buffer(line, 0.01, { units: 'kilometers' });
    const area = Math.round(turf.area(buffered as any));
    const pace = distance > 0 ? (seconds / 60) / distance : 0;

    setLastStats({ area, distance, duration: seconds, pace });
    
    // Create closed polygon from buffered area
    const coords = (buffered as any).geometry.coordinates[0];
    const closedPath = coords.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);
    
    setLastPath(closedPath);
    setVictoryZoom(true);
    
    setTimeout(() => {
      setShowVictory(true);
      setIsRecording(false);
    }, 800);

    onFinish({
      path: closedPath,
      area,
      distance,
      duration: seconds,
      mode,
    });
  }, [path, distance, seconds, mode, onFinish]);

  const formatTime = (s: number) => {
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCloseVictory = () => {
    setShowVictory(false);
    setVictoryZoom(false);
    setPath([]);
    setStartPos(null);
    setDistance(0);
    setSeconds(0);
    onClose();
  };

  // Calculate pace
  const pace = distance > 0 ? (seconds / 60) / distance : 0;
  const canDominate = distance >= 0.5; // 500m minimum for dominate

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-background z-[10000] flex flex-col"
    >
      {/* Persistent Notification Bar (ZONNA Command Center) */}
      <TrackingNotificationBar
        isVisible={isRecording}
        pace={pace}
        distance={distance * 1000} // Convert to meters
        duration={seconds}
      />

      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <ZonnaMap3D
          userPosition={userPos}
          followUser={isRecording}
          recordingPath={path}
          onVictoryZoom={victoryZoom}
          trailColor={trailColor}
          mapStyle={mapStyle}
        />
      </div>

      {/* Map Style Toggle - Floating */}
      <div className="absolute top-20 right-4 z-20">
        <MapStyleToggle
          currentStyle={mapStyle}
          onStyleChange={setMapStyle}
        />
      </div>

      {/* Top Dashboard */}
      <div className="relative z-10 p-4 safe-top">
        <div className="flex items-center justify-between mb-4">
          {/* Status Badge */}
          <div className="glass rounded-full px-4 py-2 border border-border flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isRecording ? "bg-primary animate-pulse" : "bg-muted-foreground"
            )} />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {isRecording ? 'Gravando' : 'Pronto'}
            </span>
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="glass rounded-full border border-border"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Mode Selector */}
        {!isRecording && (
          <div className="glass rounded-2xl p-1 border border-border flex">
            <button
              onClick={() => setMode('livre')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all",
                mode === 'livre' 
                  ? "bg-primary text-primary-foreground glow-zonna" 
                  : "text-muted-foreground"
              )}
            >
              <Flame className="w-4 h-4 inline mr-2" />
              Zonna Livre
            </button>
            <button
              onClick={() => setMode('dominio')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all",
                mode === 'dominio' 
                  ? "bg-primary text-primary-foreground glow-zonna" 
                  : "text-muted-foreground"
              )}
            >
              <Target className="w-4 h-4 inline mr-2" />
              Domínio
            </button>
          </div>
        )}

        {/* GPS Warning */}
        {gpsStatus === 'denied' && (
          <div className="mt-4 glass-dark rounded-2xl p-4 border border-destructive/50 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <p className="text-sm font-medium text-destructive">
              Localização negada. Ative nas configurações.
            </p>
          </div>
        )}

        {gpsStatus === 'searching' && !userPos && (
          <div className="mt-4 glass-dark rounded-2xl p-4 border border-primary/50 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary animate-pulse" />
            <p className="text-sm font-medium text-muted-foreground">
              Buscando sinal GPS...
            </p>
          </div>
        )}
      </div>

      {/* Bottom Control Panel */}
      <div className="mt-auto relative z-10 p-4 pb-8 safe-bottom">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-dark rounded-3xl p-6 border border-border"
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">
                Tempo
              </p>
              <p className="text-2xl font-mono-display font-bold text-foreground">
                {formatTime(seconds)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">
                Distância
              </p>
              <p className="text-2xl font-mono-display font-bold text-foreground">
                {distance.toFixed(2)}
                <span className="text-sm text-primary ml-1">KM</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">
                Modo
              </p>
              <p className="text-lg font-bold text-primary uppercase">
                {mode === 'livre' ? 'Livre' : 'Domínio'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4">
            {mode === 'dominio' && isRecording && (
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full",
                canClose ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  canClose ? "bg-green-400 animate-pulse" : "bg-muted-foreground"
                )} />
                <span className="text-xs font-bold uppercase">
                  {canClose ? 'Pronto para fechar' : 'Circuito aberto'}
                </span>
              </div>
            )}

            {!isRecording ? (
              <Button
                onClick={handleStart}
                disabled={!userPos}
                size="lg"
                className="bg-gradient-zonna text-primary-foreground font-black uppercase tracking-widest px-12 py-6 rounded-2xl glow-zonna-intense hover:scale-105 transition-transform"
              >
                <Play className="w-6 h-6 mr-2 fill-current" />
                Iniciar
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  onClick={handleStop}
                  variant="secondary"
                  size="lg"
                  className="font-bold uppercase tracking-wider px-8 py-6 rounded-2xl"
                >
                  <Square className="w-5 h-5 mr-2 fill-current" />
                  Parar
                </Button>

                {mode === 'dominio' && canClose && (
                  <Button
                    onClick={handleFinishDomain}
                    size="lg"
                    className="bg-gradient-zonna text-primary-foreground font-black uppercase tracking-widest px-8 py-6 rounded-2xl glow-zonna-intense animate-pulse-zonna"
                  >
                    <Trophy className="w-5 h-5 mr-2" />
                    Conquistar
                  </Button>
                )}

                {mode === 'livre' && distance >= 0.05 && (
                  <Button
                    onClick={handleFinishLivre}
                    size="lg"
                    className="bg-gradient-zonna text-primary-foreground font-black uppercase tracking-widest px-8 py-6 rounded-2xl glow-zonna-intense"
                  >
                    <Trophy className="w-5 h-5 mr-2" />
                    Finalizar
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Dominate Button - Standalone prominent button */}
          {isRecording && mode === 'livre' && (
            <div className="mt-4">
              <DominateButton
                isEnabled={canDominate}
                distance={distance * 1000} // meters
                minDistance={500}
                onDominate={handleFinishLivre}
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* Victory Modal */}
      <AnimatePresence>
        {showVictory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="victory-card-bg rounded-3xl p-8 w-full max-w-sm text-center"
            >
              {/* Trophy Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="relative mx-auto mb-6 w-20 h-20"
              >
                <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative bg-primary rounded-full w-full h-full flex items-center justify-center shadow-[0_0_40px_rgba(255,79,0,0.6)]">
                  <Trophy className="w-10 h-10 text-black" />
                </div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-black text-foreground mb-1"
              >
                TERRITÓRIO
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl font-black text-primary mb-8"
              >
                CONQUISTADO!
              </motion.p>

              {/* Stats with Dividers */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-stretch justify-center gap-0 mb-8 py-6 px-4 bg-black/40 rounded-2xl border border-border"
              >
                {/* KM */}
                <div className="flex-1 text-center px-4">
                  <p className="font-mono-stats text-3xl font-bold tracking-wider text-foreground mb-2">
                    {lastStats.distance.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                    KM
                  </p>
                </div>

                {/* Divider */}
                <div className="stat-divider self-stretch" />

                {/* Tempo */}
                <div className="flex-1 text-center px-4">
                  <p className="font-mono-stats text-3xl font-bold tracking-wider text-foreground mb-2">
                    {formatTime(lastStats.duration)}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                    Tempo
                  </p>
                </div>

                {/* Divider */}
                <div className="stat-divider self-stretch" />

                {/* Área */}
                <div className="flex-1 text-center px-4">
                  <p className="font-mono-stats text-3xl font-bold tracking-wider text-primary mb-2">
                    {lastStats.area.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                    M²
                  </p>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-4"
              >
                {/* Primary Button - DOMINAR */}
                <button
                  onClick={handleCloseVictory}
                  className="btn-zonna-primary w-full py-5 rounded-xl text-lg uppercase tracking-widest"
                >
                  Continuar Dominando
                </button>

                {/* Secondary Button - Gerar Story */}
                <Button
                  onClick={() => setShowSnapshot(true)}
                  size="lg"
                  variant="ghost"
                  className="w-full py-4 rounded-xl font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border hover:border-primary/50 transition-all"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Gerar Story
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ZONNA Snapshot for Story Generation */}
      <AnimatePresence>
        {showSnapshot && (
          <ZonnaSnapshot
            isOpen={showSnapshot}
            onClose={() => setShowSnapshot(false)}
            conquestNumber={conquestCount + 1}
            stats={lastStats}
            path={lastPath}
            trailColor={trailColor}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
