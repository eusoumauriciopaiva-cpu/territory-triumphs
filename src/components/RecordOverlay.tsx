import { useState, useEffect, useRef } from 'react';
import { X, Play, Square, Trophy, AlertCircle, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map3D } from './Map3D';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import * as turf from '@turf/turf';

interface RecordOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (data: { path: [number, number][]; area: number; distance: number }) => void;
}

export function RecordOverlay({ isOpen, onClose, onFinish }: RecordOverlayProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [path, setPath] = useState<[number, number][]>([]);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [startPos, setStartPos] = useState<[number, number] | null>(null);
  const [distance, setDistance] = useState(0);
  const [canClose, setCanClose] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [lastArea, setLastArea] = useState(0);
  const [gpsStatus, setGpsStatus] = useState<'searching' | 'ok' | 'denied'>('searching');

  const watchId = useRef<number | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (result.state === 'denied') setGpsStatus('denied');
      } catch (e) {
        // Permission API not supported
      }
    };
    checkPermission();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isOpen) {
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

                  const distToStart = turf.distance(
                    turf.point([newPos[1], newPos[0]]),
                    turf.point([startPos[1], startPos[0]]),
                    { units: 'meters' }
                  );

                  if (length > 0.1 && distToStart < 20) {
                    if (!canClose) {
                      setCanClose(true);
                      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
                    }
                  } else {
                    setCanClose(false);
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

      if (isRecording) {
        interval = setInterval(() => setSeconds((s) => s + 1), 1000);
      }
    }

    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      if (interval) clearInterval(interval);
    };
  }, [isOpen, isRecording, startPos, canClose]);

  const handleStart = () => {
    setIsRecording(true);
    setSeconds(0);
    setPath(userPos ? [userPos] : []);
    setDistance(0);
    setStartPos(userPos);
    setCanClose(false);
  };

  const handleStop = () => {
    setIsRecording(false);
  };

  const handleFinishDomain = () => {
    if (path.length < 3) return;

    const polygonPath = [...path, path[0]];
    const turfPoly = turf.polygon([polygonPath.map((p) => [p[1], p[0]])]);
    const area = Math.round(turf.area(turfPoly));

    setLastArea(area);
    setShowVictory(true);
    setIsRecording(false);
    
    onFinish({
      path: polygonPath,
      area,
      distance,
    });
  };

  const handleVictoryClose = () => {
    setShowVictory(false);
    setPath([]);
    setDistance(0);
    setSeconds(0);
    setStartPos(null);
    setCanClose(false);
    onClose();
  };

  const formatTime = (s: number) => {
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-background z-[100] flex flex-col"
    >
      {/* Map */}
      <div className="absolute inset-0 z-0">
        <Map3D 
          userPosition={userPos} 
          currentPath={path}
          followUser={isRecording}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-4">
        <div className="glass px-4 py-2 rounded-full border border-border flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isRecording ? "bg-primary animate-pulse" : "bg-muted-foreground"
          )} />
          <span className="text-primary text-xs font-bold tracking-widest uppercase">
            {isRecording ? 'Gravando' : 'Standby'}
          </span>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="glass rounded-full border border-border"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* GPS Status Alerts */}
      {gpsStatus === 'denied' && (
        <div className="relative z-10 mx-4 bg-destructive/90 p-4 rounded-2xl border border-destructive flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-white" />
          <p className="text-white text-xs font-bold uppercase tracking-tight">
            Localização negada. Ative nas configurações.
          </p>
        </div>
      )}

      {gpsStatus === 'searching' && !userPos && (
        <div className="relative z-10 mx-4 bg-primary/90 p-4 rounded-2xl border border-primary flex items-center gap-3">
          <Navigation className="w-5 h-5 text-white animate-spin" />
          <p className="text-white text-xs font-bold uppercase tracking-tight">
            Buscando sinal GPS...
          </p>
        </div>
      )}

      {/* Controls Panel */}
      <div className="relative z-10 mt-auto p-4">
        <div className="glass-dark rounded-3xl p-6 border border-border">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Tempo</p>
              <p className="text-4xl font-mono font-black tracking-tighter text-foreground">
                {formatTime(seconds)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Distância</p>
              <p className="text-4xl font-mono font-black tracking-tighter text-foreground">
                {distance.toFixed(2)}
                <span className="text-sm ml-1 text-primary font-bold">KM</span>
              </p>
            </div>
          </div>

          {/* Circuit Status & Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                canClose ? "bg-accent animate-ping" : "bg-primary opacity-50"
              )} />
              <span className={cn(
                "text-xs font-bold uppercase tracking-widest",
                canClose ? "text-accent" : "text-muted-foreground"
              )}>
                {canClose ? 'Pronto para fechar' : isRecording ? 'Circuito aberto' : 'Pronto'}
              </span>
            </div>

            {!isRecording ? (
              <Button
                onClick={handleStart}
                disabled={!userPos}
                className="bg-gradient-neon px-8 py-6 rounded-2xl glow-neon"
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                <span className="font-bold uppercase tracking-widest">Iniciar</span>
              </Button>
            ) : (
              <Button
                onClick={canClose ? handleFinishDomain : handleStop}
                className={cn(
                  "px-8 py-6 rounded-2xl transition-all",
                  canClose 
                    ? "bg-gradient-neon animate-pulse glow-neon-strong" 
                    : "bg-card border border-border"
                )}
              >
                {canClose ? (
                  <>
                    <Trophy className="w-5 h-5 mr-2" />
                    <span className="font-bold uppercase tracking-widest">Fechar Domínio</span>
                  </>
                ) : (
                  <>
                    <Square className="w-5 h-5 mr-2 fill-current" />
                    <span className="font-bold uppercase tracking-widest">Parar</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Victory Modal */}
      <AnimatePresence>
        {showVictory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-background/80 backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass rounded-3xl p-8 w-full max-w-sm border-2 border-primary glow-neon-strong text-center"
            >
              <div className="bg-gradient-neon w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 glow-neon animate-float">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              
              <h2 className="text-4xl font-black text-foreground mb-2 italic tracking-tighter uppercase">
                Vitória!
              </h2>
              
              <p className="text-muted-foreground mb-8">
                Você conquistou{' '}
                <span className="text-primary font-black">{lastArea.toLocaleString()} m²</span>
                {' '}deste território!
              </p>
              
              <Button 
                onClick={handleVictoryClose}
                className="w-full bg-gradient-neon py-6 rounded-2xl font-bold uppercase tracking-widest"
              >
                Continuar Explorando
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
