import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, MapPin, Flame, UserPlus, UserMinus, Users, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { EloBadge, XPProgressBar, StreakBadge } from './EloSystem';
import { useFollowStats, useFollow } from '@/hooks/useFollows';
import { useAuth } from '@/hooks/useAuth';
import type { Profile } from '@/types';
import { RANK_CONFIG } from '@/types';

interface VisitableProfileProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onShowFollowers?: () => void;
  onShowFollowing?: () => void;
}

export function VisitableProfile({ isOpen, onClose, profile, onShowFollowers, onShowFollowing }: VisitableProfileProps) {
  const { session } = useAuth();
  const { data: stats, isLoading: loadingStats } = useFollowStats(profile?.user_id || '');
  const { follow, unfollow, isFollowing, isUnfollowing } = useFollow();
  
  const isOwnProfile = session?.user?.id === profile?.user_id;
  const isPending = isFollowing || isUnfollowing;

  if (!isOpen || !profile) return null;

  const handleFollowToggle = () => {
    if (stats?.isFollowing) {
      unfollow(profile.user_id);
    } else {
      follow(profile.user_id);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-end justify-center bg-background/80 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-lg bg-card border-t border-border rounded-t-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-12 h-1.5 bg-muted rounded-full" />
          </div>

          <div className="p-6 pb-8 safe-bottom">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                {/* Avatar with orange fallback */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-3xl font-black text-black overflow-hidden">
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.name}
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      profile.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2">
                    <EloBadge rank={profile.rank} size="sm" showLabel={false} />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-black text-foreground">{profile.name}</h2>
                  {profile.nickname && (
                    <p className="text-sm text-primary font-medium">@{profile.nickname}</p>
                  )}
                  <p className="text-xs text-muted-foreground font-mono">
                    #{profile.unique_code}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Nível {profile.level} • {RANK_CONFIG[profile.rank].label}
                  </p>
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Followers/Following Stats */}
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={onShowFollowers}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <span className="font-bold">{stats?.followersCount || 0}</span>
                <span className="text-muted-foreground text-sm">seguidores</span>
              </button>
              <button
                onClick={onShowFollowing}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <span className="font-bold">{stats?.followingCount || 0}</span>
                <span className="text-muted-foreground text-sm">seguindo</span>
              </button>
              <StreakBadge streak={profile.current_streak} size="sm" />
            </div>

            {/* XP Progress */}
            <div className="mb-6">
              <XPProgressBar profile={profile} />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-muted/50 rounded-2xl p-4 text-center">
                <MapPin className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-xl font-mono-display font-bold text-foreground">
                {Number(profile.total_km).toFixed(1)}
              </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">KM</p>
              </div>

              <div className="bg-muted/50 rounded-2xl p-4 text-center">
                <Trophy className="w-5 h-5 mx-auto mb-2 text-primary" />
                <p className="text-xl font-mono-display font-bold text-primary">
                  {profile.total_area.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">m²</p>
              </div>

              <div className="bg-muted/50 rounded-2xl p-4 text-center">
                <Flame className="w-5 h-5 mx-auto mb-2 text-orange-400" />
                <p className="text-xl font-mono-display font-bold text-orange-400">
                  {profile.best_streak}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Melhor Streak</p>
              </div>
            </div>

            {/* Follow Button (only for other users) */}
            {!isOwnProfile && (
              <Button
                size="lg"
                onClick={handleFollowToggle}
                disabled={isPending}
                variant={stats?.isFollowing ? 'secondary' : 'default'}
                className={`w-full font-black uppercase tracking-widest py-6 rounded-2xl ${
                  !stats?.isFollowing ? 'bg-gradient-zonna text-primary-foreground glow-zonna-intense' : ''
                }`}
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : stats?.isFollowing ? (
                  <>
                    <UserMinus className="w-5 h-5 mr-2" />
                    Seguindo
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Seguir
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
