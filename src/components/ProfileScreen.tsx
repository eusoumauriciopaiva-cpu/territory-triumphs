import { useState } from 'react';
import { Edit2, Trophy, LogOut, Flame, MapPin, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { EloBadge, XPProgressBar, StreakBadge } from './EloSystem';
import { ZonnaMap3D } from './ZonnaMap3D';
import { TrailColorSelector } from './TrailColorSelector';
import type { Profile, Conquest } from '@/types';
import { RANK_CONFIG } from '@/types';
interface ProfileScreenProps {
  profile: Profile | null;
  history: Conquest[];
  onUpdateProfile: (updates: Partial<Profile & { trail_color?: string }>) => void;
  onShowOnMap: (conquest: Conquest) => void;
  onSignOut: () => void;
}

export function ProfileScreen({ 
  profile, 
  history, 
  onUpdateProfile, 
  onShowOnMap,
  onSignOut 
}: ProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [showHeatmap, setShowHeatmap] = useState(false);

  const handleSave = () => {
    onUpdateProfile({ name });
    setIsEditing(false);
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 overflow-y-auto h-full scrollbar-hide">
      {/* Header with Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-3xl bg-gradient-zonna p-0.5 rotate-2 glow-zonna">
            <div className="w-full h-full rounded-[1.3rem] bg-background border-4 border-background overflow-hidden flex items-center justify-center text-3xl font-black">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                profile.name.charAt(0).toUpperCase()
              )}
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2">
            <EloBadge rank={profile.rank} size="md" showLabel={false} />
          </div>
        </div>

        <h2 className="text-2xl font-black tracking-tighter text-foreground">{profile.name}</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Nível {profile.level} • {RANK_CONFIG[profile.rank].label}
        </p>

        <div className="flex items-center gap-3">
          <StreakBadge streak={profile.current_streak || 0} bestStreak={profile.best_streak} />
          
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-primary">
                <Edit2 className="w-4 h-4 mr-1" />
                Editar
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border">
              <DialogHeader>
                <DialogTitle className="font-black">Editar Perfil</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Nome</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-card border-border"
                  />
                </div>
                <Button onClick={handleSave} className="w-full bg-gradient-zonna">
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* XP Progress */}
      <div className="bg-card rounded-2xl p-4 border border-border mb-4">
        <XPProgressBar profile={profile} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card p-4 rounded-2xl border border-border text-center">
          <MapPin className="w-5 h-5 mx-auto mb-2 text-primary" />
          <p className="text-xl font-mono-display font-bold text-foreground">
            {Number(profile.total_km).toFixed(1)}
          </p>
          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">KM</p>
        </div>
        <div className="bg-card p-4 rounded-2xl border border-border text-center">
          <Target className="w-5 h-5 mx-auto mb-2 text-primary" />
          <p className="text-xl font-mono-display font-bold text-primary">
            {profile.total_area.toLocaleString()}
          </p>
          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">m²</p>
        </div>
        <div className="bg-card p-4 rounded-2xl border border-border text-center">
          <Flame className="w-5 h-5 mx-auto mb-2 text-orange-400" />
          <p className="text-xl font-mono-display font-bold text-orange-400">
            {profile.best_streak || 0}
          </p>
          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Streak</p>
        </div>
      </div>

      {/* Heatmap Toggle */}
      <div className="mb-4">
        <Button
          variant={showHeatmap ? "default" : "secondary"}
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="w-full"
        >
          <Target className="w-4 h-4 mr-2" />
          {showHeatmap ? 'Ocultar Mapa de Calor' : 'Ver Meus Domínios'}
        </Button>
      </div>

      {/* Heatmap */}
      {showHeatmap && (
        <div className="h-64 rounded-2xl overflow-hidden border border-border mb-6">
          <ZonnaMap3D
            userPosition={history.length > 0 ? history[0].path[0] : null}
            heatmapMode={true}
            trailColor={(profile as any)?.trail_color || '#FF4F00'}
            userConquests={history}
          />
        </div>
      )}

      {/* Trail Color Selector */}
      <div className="mb-6">
        <TrailColorSelector
          profile={profile}
          currentColor={(profile as any)?.trail_color || '#FF4F00'}
          unlockedColors={(profile as any)?.unlocked_colors || ['#FF4F00']}
          onSelectColor={(color) => onUpdateProfile({ trail_color: color } as any)}
        />
      </div>

      {/* History */}
      <div className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 ml-1">
          Meus Domínios
        </h3>
        
        {history.length === 0 ? (
          <div className="text-center py-8 bg-card rounded-2xl border border-border">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum território conquistado ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 10).map((conquest, index) => (
              <button
                key={conquest.id}
                onClick={() => onShowOnMap(conquest)}
                className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between group hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg border border-primary/20 group-hover:bg-primary/20 transition-colors">
                    <Trophy className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-sm block">Território #{history.length - index}</span>
                    <span className="text-xs text-muted-foreground">
                      {Number(conquest.distance).toFixed(2)} km
                    </span>
                  </div>
                </div>
                <span className="text-primary font-mono-display font-bold text-sm">
                  {conquest.area.toLocaleString()} m²
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sign Out */}
      <Button 
        variant="ghost" 
        onClick={onSignOut}
        className="w-full text-destructive hover:bg-destructive/10"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sair da Conta
      </Button>
    </div>
  );
}
