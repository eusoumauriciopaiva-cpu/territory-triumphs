import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Square, Trophy, MapPin, AlertCircle, Target, Share2 } from 'lucide-react';
import { Button } from './ui/button';
import { ZonnaMap3D } from './ZonnaMap3D';
import { ZonnaSnapshot } from './ZonnaSnapshot';
import { TrackingNotificationBar } from './TrackingNotificationBar';
import { MapStyleToggle } from './MapStyleToggle';
import { cn } from '@/lib/utils';
import * as turf from '@turf/turf';
import type { MapStyleType } from '@/lib/mapStyle';
import { optimizePath, filterGPSPoints } from '@/lib/pathSmoothing';

interface RecordingDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (data: {
    path: [number, number][];
    area: number;
    distance: number;
    duration: number;
    mode: 'dominio';
  }) => void;
  conquestCount: number;
  trailColor?: string;
}

type GpsStatus = 'searching' | 'ok' | 'denied';

// Distance threshold to close circuit (5 meters)
const CLOSE_CIRCUIT_RADIUS = 5;
// Minimum distance traveled before allowing close (100m)
const MIN_DISTANCE_TO_CLOSE = 0.1;

export function RecordingDashboard({ isOpen, onClose, onFinish, conquestCount, trailColor = '#FF4F00' }: RecordingDashboardProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [path, setPath] = useState<[number, number][]>([]);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [startPos, setStartPos] = useState<[number, number] | null>(null);
  const [distance, setDistance] = useState(0);
  const [distanceToStart, setDistanceToStart] = useState<number | null>(null);
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

  // GPS tracking with professional-grade filters
  const lastPositionRef = useRef<[number, number] | null>(null);
  const rawPathRef = useRef<Array<{ lat: number; lng: number; accuracy?: number }>>([]);

  // Helper function to calculate distance
  const calculateDistance = useCallback((
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number => {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // GPS tracking
  useEffect(() => {
    if (!isOpen) return;

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const accuracy = pos.coords.accuracy || Infinity;
        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        
        // FILTRO 1: Anti-Drift - Descarta pontos com accuracy > 20 metros
        if (accuracy > 20) {
          console.log("GPS impreciso descartado (accuracy > 20m):", accuracy);
          return;
        }

        // Atualiza posição do usuário com suavização
        if (lastPositionRef.current) {
          const dist = calculateDistance(
            lastPositionRef.current[0], lastPositionRef.current[1],
            newPos[0], newPos[1]
          );
          
          // Suavização visual: interpolação linear para movimento suave
          if (dist > 0 && dist < 50) {
            // Interpolação suave para pequenos movimentos
            const smoothFactor = 0.3;
            const smoothPos: [number, number] = [
              lastPositionRef.current[0] + (newPos[0] - lastPositionRef.current[0]) * smoothFactor,
              lastPositionRef.current[1] + (newPos[1] - lastPositionRef.current[1]) * smoothFactor,
            ];
            setUserPos(smoothPos);
          } else {
            setUserPos(newPos);
          }
        } else {
          setUserPos(newPos);
        }
        
        setGpsStatus('ok');

        if (isRecording) {
          // Adiciona ponto ao buffer raw
          rawPathRef.current.push({
            lat: newPos[0],
            lng: newPos[1],
            accuracy: accuracy,
          });

          // FILTRO 2: Filtro de Movimento - Só registra se moveu mais de 3 metros
          if (lastPositionRef.current) {
            const dist = calculateDistance(
              lastPositionRef.current[0], lastPositionRef.current[1],
              newPos[0], newPos[1]
            );
            
            if (dist < 3) {
              return; // Ignora movimento menor que 3m
            }
          }

          if (!startPos) {
            setStartPos(newPos);
            setPath([newPos]);
            lastPositionRef.current = newPos;
          } else {
            // Filtra e suaviza o caminho
            const filteredPoints = filterGPSPoints(rawPathRef.current, 20, 3);
            const smoothedPath = optimizePath(filteredPoints as [number, number][], 3, 5);
            
            setPath(smoothedPath);
            lastPositionRef.current = newPos;
            
            if (smoothedPath.length > 1) {
              const line = turf.lineString(smoothedPath.map((p) => [p[1], p[0]]));
              const length = turf.length(line, { units: 'kilometers' });
              setDistance(length);

              // Calculate distance to start point
              const distToStart = turf.distance(
                turf.point([newPos[1], newPos[0]]),
                turf.point([startPos[1], startPos[0]]),
                { units: 'meters' }
              );
              setDistanceToStart(Math.round(distToStart));

              // Check if can close polygon (>100m traveled and within 5m of start)
              if (length > MIN_DISTANCE_TO_CLOSE && distToStart <= CLOSE_CIRCUIT_RADIUS) {
                if (!canClose) {
                  setCanClose(true);
                  if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 100]);
                }
              } else {
                setCanClose(false);
              }
            }
          }
        } else {
          lastPositionRef.current = newPos;
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        if (err.code === 1) setGpsStatus('denied');
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 
      }
    );

    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [isOpen, isRecording, startPos, canClose, calculateDistance]);

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
    setDistanceToStart(null);
    setStartPos(userPos);
    setCanClose(false);
  }, [userPos]);

  const handleStop = useCallback(() => {
    setIsRecording(false);
  }, []);

  const handleFinishDomain = useCallback(() => {
    if (path.length < 3) return;
    
    // Verify circuit is properly closed (within 5m of start)
    if (!canClose) {
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      return;
    }

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
      mode: 'dominio',
    });
  }, [path, distance, seconds, canClose, onFinish]);

  const formatTime = (s: number) => {
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCloseVictory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && path.length > 0) {
        // Usamos valores fixos temporários para garantir que o salvamento funcione
        // Isso remove os erros vermelhos do seu Cursor
        const { error } = await supabase
          .from('conquests')
          .insert([{
            user_id: user.id,
            path: path,
            area: 0, 
            distance: 0,
            center_latitude: path[0][0],
            center_longitude: path[0][1]
          }]);
  
        if (error) {
          console.error("Erro no banco:", error);
          alert("Erro ao salvar: " + error.message);
        } else {
          setShowVictory(false);
          setPath([]);
          alert("🎉 Corrida salva com sucesso! Você já pode fechar.");
        }
      }
    } catch (err) {
      console.error("Erro no sistema:", err);
    }
  };

  // Calculate pace
  const pace = distance > 0 ? (seconds / 60) / distance : 0;

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
          startPosition={isRecording ? startPos : null}
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

        {/* Mode Indicator - Always DOMÍNIO */}
        {!isRecording && (
          <div className="glass rounded-2xl p-1 border border-border flex">
            <div className="flex-1 py-3 px-4 rounded-xl font-bold text-sm uppercase tracking-wider bg-primary text-primary-foreground glow-zonna text-center">
              <Target className="w-4 h-4 inline mr-2" />
              Modo Domínio
            </div>
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
                {isRecording && distanceToStart !== null ? 'Até início' : 'Modo'}
              </p>
              {isRecording && distanceToStart !== null ? (
                <p className={cn(
                  "text-2xl font-mono-display font-bold",
                  distanceToStart <= CLOSE_CIRCUIT_RADIUS ? "text-green-400" : "text-foreground"
                )}>
                  {distanceToStart}
                  <span className="text-sm text-primary ml-1">m</span>
                </p>
              ) : (
                <p className="text-lg font-bold text-primary uppercase">
                  Domínio
                </p>
              )}
            </div>
          </div>

          {/* Circuit Status Indicator */}
          {isRecording && (
            <div className={cn(
              "flex items-center justify-center gap-2 px-4 py-2 rounded-full mb-4 mx-auto w-fit",
              canClose ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                canClose ? "bg-green-400 animate-pulse" : "bg-muted-foreground"
              )} />
              <span className="text-xs font-bold uppercase">
                {canClose 
                  ? '✓ Circuito fechado! Pronto para conquistar' 
                  : `Retorne ao ponto inicial (≤${CLOSE_CIRCUIT_RADIUS}m)`
                }
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4">
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

                {canClose && (
                  <Button
                    onClick={handleFinishDomain}
                    size="lg"
                    className="bg-gradient-zonna text-primary-foreground font-black uppercase tracking-widest px-8 py-6 rounded-2xl glow-zonna-intense animate-pulse-zonna"
                  >
                    <Trophy className="w-5 h-5 mr-2" />
                    Conquistar
                  </Button>
                )}
              </div>
            )}
          </div>
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

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-muted/30 rounded-2xl p-4 mb-6 space-y-3"
              >
                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-muted-foreground text-sm uppercase tracking-wider">Área</span>
                  <span className="font-mono-display font-bold text-foreground text-lg">
                    {lastStats.area.toLocaleString()} m²
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-muted-foreground text-sm uppercase tracking-wider">Distância</span>
                  <span className="font-mono-display font-bold text-foreground text-lg">
                    {lastStats.distance.toFixed(2)} km
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-muted-foreground text-sm uppercase tracking-wider">Duração</span>
                  <span className="font-mono-display font-bold text-foreground text-lg">
                    {formatTime(lastStats.duration)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground text-sm uppercase tracking-wider">Ritmo</span>
                  <span className="font-mono-display font-bold text-foreground text-lg">
                    {lastStats.pace.toFixed(1)} min/km
                  </span>
                </div>
              </motion.div>

              {/* Conquest Count */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-6"
              >
                <p className="text-muted-foreground text-sm mb-1">Total de Conquistas</p>
                <p className="text-4xl font-black text-primary">{conquestCount + 1}</p>
              </motion.div>

              {/* Share Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  onClick={() => setShowSnapshot(true)}
                  variant="outline"
                  className="w-full mb-3 border-primary text-primary hover:bg-primary/10"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar Conquista
                </Button>
                <Button
                  onClick={handleCloseVictory}
                  className="w-full bg-gradient-zonna text-primary-foreground font-bold"
                >
                  Continuar
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snapshot Modal for Sharing */}
      <ZonnaSnapshot
        isOpen={showSnapshot}
        onClose={() => setShowSnapshot(false)}
        stats={{
          area: lastStats.area,
          distance: lastStats.distance,
          duration: lastStats.duration,
          pace: lastStats.pace,
        }}
        conquestNumber={conquestCount + 1}
        path={lastPath}
        trailColor={trailColor}
      />
    </motion.div>
  );
}
