import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center splash-bg"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={() => {
        setTimeout(onComplete, 2000);
      }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-radial-zonna opacity-50" />
      
      {/* Logo */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Icon */}
        <motion.div
          className="relative mb-6"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="absolute inset-0 bg-primary rounded-full blur-2xl opacity-50 animate-pulse-zonna" />
          <div className="relative bg-gradient-zonna p-6 rounded-3xl glow-zonna-intense">
            <Flame className="w-16 h-16 text-primary-foreground" />
          </div>
        </motion.div>

        {/* Brand Name */}
        <motion.h1
          className="text-6xl font-black tracking-tighter text-foreground text-glow-zonna"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          ZONNA
        </motion.h1>

        {/* Slogan */}
        <motion.p
          className="mt-4 text-sm font-medium text-muted-foreground tracking-widest uppercase"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Domine o chão que você pisa
        </motion.p>
      </motion.div>

      {/* Loading indicator */}
      <motion.div
        className="absolute bottom-20 flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
