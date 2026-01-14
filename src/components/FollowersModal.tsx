import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { RankBadge } from './RankBadge';
import { useFollowersWithProfiles, useFollowingWithProfiles, useFollow, useFollowStats } from '@/hooks/useFollows';
import { useAuth } from '@/hooks/useAuth';
import type { Profile } from '@/types';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
  onViewProfile: (profile: Profile) => void;
}

export function FollowersModal({ isOpen, onClose, userId, type, onViewProfile }: FollowersModalProps) {
  const { session } = useAuth();
  const { data: followers = [], isLoading: loadingFollowers } = useFollowersWithProfiles(userId);
  const { data: following = [], isLoading: loadingFollowing } = useFollowingWithProfiles(userId);

  const profiles = type === 'followers' ? followers : following;
  const isLoading = type === 'followers' ? loadingFollowers : loadingFollowing;

  if (!isOpen) return null;

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
          className="w-full max-w-lg bg-card border-t border-border rounded-t-3xl max-h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-12 h-1.5 bg-muted rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-black">
                {type === 'followers' ? 'Seguidores' : 'Seguindo'}
              </h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="h-[60vh] p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : profiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {type === 'followers' ? 'Nenhum seguidor ainda' : 'Não está seguindo ninguém'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {profiles.map((profile) => (
                  <ProfileListItem
                    key={profile.user_id}
                    profile={profile}
                    currentUserId={session?.user?.id}
                    onViewProfile={onViewProfile}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ProfileListItem({
  profile,
  currentUserId,
  onViewProfile,
}: {
  profile: Profile;
  currentUserId?: string;
  onViewProfile: (profile: Profile) => void;
}) {
  const { data: stats } = useFollowStats(profile.user_id);
  const { follow, unfollow, isFollowing, isUnfollowing } = useFollow();
  const isOwnProfile = currentUserId === profile.user_id;
  const isPending = isFollowing || isUnfollowing;

  return (
    <button
      onClick={() => onViewProfile(profile)}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-lg font-black text-black overflow-hidden flex-shrink-0">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          profile.name.charAt(0).toUpperCase()
        )}
      </div>

      {/* Info */}
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">{profile.name}</span>
          <RankBadge rank={profile.rank} size="sm" showLabel={false} />
        </div>
        {profile.nickname && (
          <p className="text-xs text-primary">@{profile.nickname}</p>
        )}
      </div>

      {/* Follow Button */}
      {!isOwnProfile && (
        <Button
          variant={stats?.isFollowing ? 'secondary' : 'default'}
          size="sm"
          disabled={isPending}
          onClick={(e) => {
            e.stopPropagation();
            if (stats?.isFollowing) {
              unfollow(profile.user_id);
            } else {
              follow(profile.user_id);
            }
          }}
          className="flex-shrink-0"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : stats?.isFollowing ? (
            <>
              <UserMinus className="w-4 h-4 mr-1" />
              Seguindo
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-1" />
              Seguir
            </>
          )}
        </Button>
      )}
    </button>
  );
}
