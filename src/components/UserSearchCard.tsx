import { Trophy, MapPin, Flame } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { EloBadge } from './EloSystem';
import type { Profile } from '@/types';
import { RANK_CONFIG } from '@/types';

interface UserSearchCardProps {
  profile: Profile;
  onClick?: () => void;
}

export function UserSearchCard({ profile, onClick }: UserSearchCardProps) {
  const initials = profile.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <button
      onClick={onClick}
      className="w-full bg-card p-4 rounded-xl border border-border flex items-center gap-4 group hover:border-primary/50 transition-all hover:bg-card/80"
    >
      {/* Avatar with orange fallback */}
      <div className="relative shrink-0">
        <Avatar className="w-14 h-14 border-2 border-primary/30">
          <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
          <AvatarFallback className="bg-primary text-black font-bold text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1">
          <EloBadge rank={profile.rank} size="sm" showLabel={false} />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground truncate">{profile.name}</span>
          {profile.nickname && (
            <span className="text-xs text-muted-foreground">@{profile.nickname}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-primary font-mono">#{profile.unique_code}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            Nível {profile.level} • {RANK_CONFIG[profile.rank].label}
          </span>
        </div>
        
        {/* Stats row */}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {Number(profile.total_km).toFixed(1)} km
          </span>
          <span className="flex items-center gap-1 text-primary">
            <Trophy className="w-3 h-3" />
            {profile.total_area.toLocaleString()} m²
          </span>
          {profile.best_streak > 0 && (
            <span className="flex items-center gap-1 text-orange-400">
              <Flame className="w-3 h-3" />
              {profile.best_streak}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
