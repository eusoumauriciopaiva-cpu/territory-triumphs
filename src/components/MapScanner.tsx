import { motion } from 'framer-motion';
import { Radar } from 'lucide-react';

interface MapScannerProps {
  isScanning: boolean;
}

export function MapScanner({ isScanning }: MapScannerProps) {
  if (!isScanning) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[5000] pointer-events-none"
    >
      {/* Scan overlay */}
      <div className="absolute inset-0 bg-gradient-radial-zonna opacity-20" />
      
      {/* Scanning lines */}
      <motion.div
        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
        initial={{ top: 0 }}
        animate={{ top: '100%' }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: 'linear'
        }}
        style={{ 
          boxShadow: '0 0 30px 10px hsl(var(--primary) / 0.5)'
        }}
      />

      {/* Center indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="relative"
          >
            <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-50" />
            <div className="relative bg-card border-2 border-primary p-4 rounded-full glow-zonna">
              <Radar className="w-8 h-8 text-primary" />
            </div>
          </motion.div>

          <div className="glass-dark px-6 py-3 rounded-full border border-primary/30">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">
              Carregando territórios do clã...
            </p>
          </div>
        </motion.div>
      </div>

      {/* Radar rings */}
      {[1, 2, 3].map((ring) => (
        <motion.div
          key={ring}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-primary/20 rounded-full"
          style={{
            width: `${ring * 30}%`,
            height: `${ring * 30}%`,
          }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ 
            scale: [1, 1.5, 1], 
            opacity: [0.3, 0, 0.3] 
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            delay: ring * 0.3,
            ease: 'easeOut'
          }}
        />
      ))}
    </motion.div>
  );
}
