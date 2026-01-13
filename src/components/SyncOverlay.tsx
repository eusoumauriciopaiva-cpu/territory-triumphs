import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Wifi } from 'lucide-react';

interface SyncOverlayProps {
  isVisible: boolean;
  clanName: string;
  onComplete: () => void;
}

export function SyncOverlay({ isVisible, clanName, onComplete }: SyncOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Conectando...');

  useEffect(() => {
    if (!isVisible) return;

    const statuses = [
      'Conectando ao Clã...',
      'Sincronizando territórios...',
      'Carregando manchas de domínio...',
      'Mapa atualizado!',
    ];

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < statuses.length) {
        setStatus(statuses[step]);
        setProgress((step / (statuses.length - 1)) * 100);
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 500);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center"
        >
          {/* Pulse rings */}
          <div className="relative mb-8">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-2 border-primary/30"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ 
                  scale: [1, 2.5], 
                  opacity: [0.8, 0] 
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: 'easeOut',
                }}
                style={{
                  width: 80,
                  height: 80,
                }}
              />
            ))}
            
            <div className="relative w-20 h-20 bg-gradient-neon rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Clan name */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-6"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              SINCRONIZANDO COM
            </p>
            <h2 className="text-3xl font-black text-primary">{clanName}</h2>
          </motion.div>

          {/* Progress */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-64"
          >
            <div className="flex items-center gap-2 justify-center mb-3">
              <Wifi className="w-4 h-4 text-primary animate-pulse" />
              <p className="text-sm text-muted-foreground">{status}</p>
            </div>
            
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-neon"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>

          {/* Scanning lines effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                initial={{ top: '0%' }}
                animate={{ top: '100%' }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: 'linear',
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
