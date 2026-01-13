import { useState } from 'react';
import { Edit2, Trophy, LogOut, Flame, MapPin, Target, ChevronRight, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { EloBadge, XPProgressBar, StreakBadge } from './EloSystem';
import { ZonnaMap3D } from './ZonnaMap3D';
import { ZonnaCodex } from './ZonnaCodex';
import { AvatarUpload } from './AvatarUpload';
import type { Profile, Conquest } from '@/types';
import { RANK_CONFIG } from '@/types';
import { cn } from '@/lib/utils';

interface ProfileScreenProps {
  profile: Profile | null;
  history: Conquest[];
  onUpdateProfile: (updates: Partial<Profile & { trail_color?: string; avatar_url?: string }>) => void;
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
  const [activeSection, setActiveSection] = useState<'stats' | 'codex' | 'history'>('stats');

  const handleSave = () => {
    onUpdateProfile({ name });
    setIsEditing(false);
  };

  const handleAvatarChange = (url: string) => {
    onUpdateProfile({ avatar_url: url });
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const trailColor = (profile as any)?.trail_color || '#FF4F00';
  const unlockedColors = (profile as any)?.unlocked_colors || ['#FF4F00'];

  return (
    <div className="p-4 pb-24 overflow-y-auto h-full scrollbar-hide">
      {/* Header with Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-4">
          <AvatarUpload
            userId={profile.user_id}
            currentAvatar={profile.avatar_url}
            name={profile.name}
            size="lg"
            onAvatarChange={handleAvatarChange}
          />
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
                <Settings className="w-4 h-4 mr-1" />
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
                <Button onClick={handleSave} className="w-full bg-primary text-black font-bold">
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

      {/* Section Tabs */}
      <div className="flex gap-2 mb-4 p-1 bg-card rounded-xl border border-border">
        {[
          { id: 'stats', label: 'Stats' },
          { id: 'codex', label: 'Codex' },
          { id: 'history', label: 'Domínios' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={cn(
              'flex-1 py-2.5 px-4 rounded-lg font-bold text-sm uppercase tracking-wider transition-all',
              activeSection === tab.id
                ? 'bg-primary text-black'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats Section */}
      {activeSection === 'stats' && (
        <div className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card p-4 rounded-2xl border border-border text-center">
              <MapPin className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-xl font-mono-stats font-bold text-foreground tracking-wider">
                {Number(profile.total_km).toFixed(1)}
              </p>
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">KM</p>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-border text-center">
              <Target className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-xl font-mono-stats font-bold text-primary tracking-wider">
                {profile.total_area.toLocaleString()}
              </p>
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">m²</p>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-border text-center">
              <Flame className="w-5 h-5 mx-auto mb-2 text-orange-400" />
              <p className="text-xl font-mono-stats font-bold text-orange-400 tracking-wider">
                {profile.best_streak || 0}
              </p>
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Streak</p>
            </div>
          </div>

          {/* Heatmap Toggle */}
          <Button
            variant={showHeatmap ? "default" : "secondary"}
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="w-full"
          >
            <Target className="w-4 h-4 mr-2" />
            {showHeatmap ? 'Ocultar Mapa de Calor' : 'Ver Meus Domínios'}
          </Button>

          {/* Heatmap */}
          {showHeatmap && (
            <div className="h-64 rounded-2xl overflow-hidden border border-border">
              <ZonnaMap3D
                userPosition={history.length > 0 ? history[0].path[0] : null}
                heatmapMode={true}
                trailColor={trailColor}
                userConquests={history}
              />
            </div>
          )}
        </div>
      )}

      {/* Codex Section */}
      {activeSection === 'codex' && (
        <ZonnaCodex
          profile={{ ...profile, trail_color: trailColor, unlocked_colors: unlockedColors }}
          conquests={history}
          currentColor={trailColor}
          onSelectColor={(color) => onUpdateProfile({ trail_color: color } as any)}
        />
      )}

      {/* History Section */}
      {activeSection === 'history' && (
        <div>
          {history.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <Trophy className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground font-medium">
                Nenhum território conquistado ainda.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Comece a correr para dominar áreas!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 15).map((conquest, index) => (
                <button
                  key={conquest.id}
                  onClick={() => onShowOnMap(conquest)}
                  className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between group hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 group-hover:bg-primary/20 transition-colors">
                      <Trophy className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-sm block">Território #{history.length - index}</span>
                      <span className="text-xs text-muted-foreground">
                        {Number(conquest.distance).toFixed(2)} km • {new Date(conquest.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-mono-stats font-bold text-sm">
                      {conquest.area.toLocaleString()} m²
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sign Out - Always visible at bottom */}
      <div className="mt-8">
        <Button 
          variant="ghost" 
          onClick={onSignOut}
          className="w-full text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair da Conta
        </Button>
      </div>
    </div>
  );
}
