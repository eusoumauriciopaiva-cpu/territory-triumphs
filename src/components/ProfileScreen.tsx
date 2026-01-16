import { useState, useEffect } from 'react';
import { Trophy, LogOut, Flame, MapPin, Target, ChevronRight, Settings, Check, X, Loader2, AtSign, Shield, Users, Palette } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { EloBadge, XPProgressBar, StreakBadge } from './EloSystem';
import { ZonnaMap3D } from './ZonnaMap3D';
import { ZonnaCodex } from './ZonnaCodex';
import { TrailColorSelector } from './TrailColorSelector';
import { AvatarUpload } from './AvatarUpload';
import { AdminCommandPanel } from './AdminCommandPanel';
import { FollowersModal } from './FollowersModal';
import { DailyMissions } from './DailyMissions';
import { useNicknameValidation, validateNicknameFormat } from '@/hooks/useNicknameValidation';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useFollowStats } from '@/hooks/useFollows';
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
  // Debug logs
  console.log('ProfileScreen - Profile data:', profile);
  console.log('ProfileScreen - Rank config:', RANK_CONFIG);
  console.log('ProfileScreen - History:', history);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [activeSection, setActiveSection] = useState<'stats' | 'codex' | 'history' | 'admin'>('stats');
  const [followersModal, setFollowersModal] = useState<{
    isOpen: boolean;
    type: 'followers' | 'following';
  }>({ isOpen: false, type: 'followers' });

  // Check if user is admin - only if profile exists
  const { data: isAdmin } = useIsAdmin();

  // Get follow stats - only if profile and user_id exist
  const { data: followStats } = useFollowStats(profile?.user_id || '');

  // Nickname validation
  const nicknameValidation = useNicknameValidation(nickname);

  // Reset form when dialog opens
  useEffect(() => {
    if (isEditing && profile) {
      setName(profile.name);
      setNickname(profile.nickname || '');
    }
  }, [isEditing, profile]);

  const handleSave = () => {
    // Validate before saving
    if (nickname && !nicknameValidation.isAvailable) {
      return;
    }

    onUpdateProfile({
      name,
      ...(nickname ? { nickname: nickname.toLowerCase() } : {})
    });
    setIsEditing(false);
  };

  const handleAvatarChange = (url: string) => {
    onUpdateProfile({ avatar_url: url });
  };

  // Early return with loading state if profile is null
  if (!profile) {
    console.log('ProfileScreen - Profile is null, showing loading state');
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Validate profile rank exists in RANK_CONFIG
  if (!profile.rank || !RANK_CONFIG[profile.rank]) {
    console.error('ProfileScreen - Invalid rank:', profile.rank);
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <p className="text-destructive font-bold mb-2">Erro ao carregar perfil</p>
          <p className="text-sm text-muted-foreground">Rank inválido: {profile.rank || 'não definido'}</p>
        </div>
      </div>
    );
  }

  const trailColor = (profile as any)?.trail_color || '#FF4F00';
  const unlockedColors = (profile as any)?.unlocked_colors || ['#FF4F00'];

  try {
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
        {profile.nickname && (
          <p className="text-sm text-primary font-medium">@{profile.nickname}</p>
        )}
        <p className="text-xs text-muted-foreground font-mono mt-1">
          #{profile.unique_code}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Nível {profile.level || 0} • {profile.rank && RANK_CONFIG[profile.rank] ? RANK_CONFIG[profile.rank].label : 'Explorador'}
        </p>

        {/* Followers/Following Stats */}
        <div className="flex items-center gap-4 mt-3 mb-2">
          <button
            onClick={() => setFollowersModal({ isOpen: true, type: 'followers' })}
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <span className="font-bold">{followStats?.followersCount || 0}</span>
            <span className="text-muted-foreground text-sm">seguidores</span>
          </button>
          <button
            onClick={() => setFollowersModal({ isOpen: true, type: 'following' })}
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <span className="font-bold">{followStats?.followingCount || 0}</span>
            <span className="text-muted-foreground text-sm">seguindo</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <StreakBadge streak={profile.current_streak || 0} bestStreak={profile.best_streak} />

          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-primary">
                <Settings className="w-4 h-4 mr-1" />
                Editar
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border max-h-[85vh]">
              <DialogHeader>
                <DialogTitle className="font-black">Editar Perfil</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[65vh] pr-4">
                <div className="space-y-4">
                  {/* Name field */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Nome</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-card border-border"
                      placeholder="Seu nome"
                    />
                  </div>

                  {/* Nickname field with real-time validation */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                      <AtSign className="w-3 h-3" />
                      Nickname (opcional)
                    </label>
                    <div className="relative">
                      <Input
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                        className={cn(
                          "bg-card border-border pr-10",
                          nicknameValidation.error && "border-destructive focus:border-destructive",
                          nicknameValidation.isAvailable === true && nickname && "border-green-500 focus:border-green-500"
                        )}
                        placeholder="seu_nick"
                        maxLength={20}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {nicknameValidation.isChecking && (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        )}
                        {!nicknameValidation.isChecking && nicknameValidation.isAvailable === true && nickname && (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                        {!nicknameValidation.isChecking && nicknameValidation.isAvailable === false && (
                          <X className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                    </div>
                    {nicknameValidation.error && (
                      <p className="text-xs text-destructive">{nicknameValidation.error}</p>
                    )}
                    {nicknameValidation.isAvailable && nickname && (
                      <p className="text-xs text-green-500">Nick disponível!</p>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      Apenas letras, números e underscore. Ex: @comandante_zonna
                    </p>
                  </div>

                  {/* Z-ID (read-only) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">
                      Código ZONNA (permanente)
                    </label>
                    <div className="bg-muted/50 px-3 py-2 rounded-md border border-border">
                      <span className="font-mono text-primary font-bold">#{profile.unique_code}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Seu ID único para recrutamento. Compartilhe com amigos!
                    </p>
                  </div>

                  {/* Trail Color Selector */}
                  <div className="pt-2">
                    <TrailColorSelector
                      currentColor={trailColor}
                      onSelectColor={(color) => onUpdateProfile({ trail_color: color } as any)}
                    />
                  </div>

                  <Button
                    onClick={handleSave}
                    className="w-full bg-primary text-black font-bold"
                    disabled={nickname ? !nicknameValidation.isAvailable || nicknameValidation.isChecking : false}
                  >
                    Salvar
                  </Button>
                </div>
              </ScrollArea>
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
          ...(isAdmin === true ? [{ id: 'admin', label: 'Admin', icon: Shield }] : []),
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
            {/* KM Total */}
            <div className="bg-card p-4 rounded-2xl border border-border text-center">
              <MapPin className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-xl font-mono-stats font-bold text-foreground tracking-wider break-words">
                {(() => {
                  const km = profile?.total_km;
                  if (km === null || km === undefined) return '0.0';
                  const numKm = typeof km === 'string' ? parseFloat(km) : Number(km);
                  return isNaN(numKm) ? '0.0' : numKm.toFixed(1);
                })()}
              </p>
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">KM</p>
            </div>

            {/* Área Total em m² */}
            <div className="bg-card p-4 rounded-2xl border border-border text-center">
              <Target className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-xl font-mono-stats font-bold text-primary tracking-wider break-words">
                {(() => {
                  const area = profile?.total_area;
                  if (area === null || area === undefined) return '0';
                  const numArea = typeof area === 'string' ? parseFloat(area) : Number(area);
                  if (isNaN(numArea)) return '0';
                  const rounded = Math.round(numArea);
                  // Formata números grandes de forma compacta
                  if (rounded >= 1000000) {
                    return (rounded / 1000000).toFixed(1) + 'M';
                  } else if (rounded >= 1000) {
                    return (rounded / 1000).toFixed(1) + 'k';
                  }
                  return rounded.toLocaleString('pt-BR');
                })()}
              </p>
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">m²</p>
            </div>

            {/* Streak */}
            <div className="bg-card p-4 rounded-2xl border border-border text-center">
              <Flame className="w-5 h-5 mx-auto mb-2 text-orange-400" />
              <p className="text-xl font-mono-stats font-bold text-orange-400 tracking-wider">
                {profile?.best_streak || 0}
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
                userPosition={history && history.length > 0 && history[0]?.path?.[0] ? history[0].path[0] : null}
                heatmapMode={true}
                trailColor={trailColor}
                userConquests={history || []}
              />
            </div>
          )}
        </div>
      )}

      {/* Codex Section */}
      {activeSection === 'codex' && (
        <ZonnaCodex
          currentColor={trailColor}
          onSelectColor={(color) => onUpdateProfile({ trail_color: color } as any)}
        />
      )}

      {/* History Section */}
      {activeSection === 'history' && (
        <div>
          {!history || history.length === 0 ? (
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
              {(history || []).slice(0, 15).map((conquest, index) => (
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
                      <span className="font-bold text-sm block">Território #{(history?.length || 0) - index}</span>
                      <span className="text-xs text-muted-foreground">
                        {(() => {
                          const dist = conquest?.distance;
                          if (dist === null || dist === undefined) return '0.00 km';
                          const numDist = typeof dist === 'string' ? parseFloat(dist) : Number(dist);
                          return isNaN(numDist) ? '0.00 km' : numDist.toFixed(2) + ' km';
                        })()} • {conquest?.created_at ? new Date(conquest.created_at).toLocaleDateString('pt-BR') : 'Data inválida'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-mono-stats font-bold text-sm">
                      {(() => {
                        const area = conquest?.area;
                        if (area === null || area === undefined) return '0 m²';
                        const numArea = typeof area === 'string' ? parseFloat(area) : Number(area);
                        return isNaN(numArea) ? '0 m²' : Math.round(numArea).toLocaleString('pt-BR') + ' m²';
                      })()}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Command Panel - Inline for master admin */}
      {activeSection === 'admin' && isAdmin === true && (
        <AdminCommandPanel />
      )}

      {/* Followers Modal */}
      {profile && (
        <FollowersModal
          isOpen={followersModal.isOpen}
          onClose={() => setFollowersModal({ isOpen: false, type: 'followers' })}
          userId={profile.user_id}
          type={followersModal.type}
          onViewProfile={() => { }} // Can't navigate to own profile from own profile
        />
      )}

      {/* Daily Missions */}
      <DailyMissions />

      {/* Sign Out - Always visible at bottom */}
      <div className="mt-4">
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
  } catch (error) {
    console.error('ProfileScreen - Error rendering:', error);
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <p className="text-destructive font-bold mb-2">Erro ao renderizar perfil</p>
          <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : 'Erro desconhecido'}</p>
        </div>
      </div>
    );
  }
}
