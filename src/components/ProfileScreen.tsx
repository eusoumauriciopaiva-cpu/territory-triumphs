import { useState } from 'react';
import { Edit2, Trophy, MapPin, LogOut, Camera } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { RankBadge, RankProgress } from './RankBadge';
import type { Profile, Conquest } from '@/types';

interface ProfileScreenProps {
  profile: Profile | null;
  history: Conquest[];
  onUpdateProfile: (updates: Partial<Profile>) => void;
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

  const handleSave = () => {
    onUpdateProfile({ name });
    setIsEditing(false);
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 overflow-y-auto h-full flex flex-col items-center">
      {/* Avatar & Name */}
      <div className="relative mb-4 mt-4">
        <div className="w-28 h-28 rounded-3xl bg-gradient-neon p-1 rotate-3 glow-neon">
          <div className="w-full h-full rounded-[1.3rem] bg-background border-4 border-background overflow-hidden flex items-center justify-center text-4xl font-black">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              profile.name.charAt(0).toUpperCase()
            )}
          </div>
        </div>
        <div className="absolute -bottom-1 -right-1 bg-gradient-neon px-3 py-1 rounded-lg border-4 border-background font-black text-xs -rotate-6 tracking-tight uppercase">
          LVL {profile.level}
        </div>
      </div>

      <h2 className="text-2xl font-black italic tracking-tighter mb-1">{profile.name}</h2>
      
      <RankBadge rank={profile.rank} size="lg" />

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="mt-4 text-primary">
            <Edit2 className="w-4 h-4 mr-2" />
            Editar Perfil
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
            <Button onClick={handleSave} className="w-full bg-gradient-neon">
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rank Progress */}
      <div className="w-full max-w-sm mt-6 bg-card rounded-2xl p-4 border border-border">
        <RankProgress xp={profile.xp} rank={profile.rank} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-4">
        <div className="bg-card p-5 rounded-2xl border border-border text-center">
          <p className="text-2xl font-black tracking-tighter">{Number(profile.total_km).toFixed(1)}</p>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">KM Totais</p>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-border text-center">
          <p className="text-2xl font-black tracking-tighter">{profile.total_area.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">m² Conquistados</p>
        </div>
      </div>

      {/* History */}
      <div className="w-full mt-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 ml-1">
          Meu Histórico
        </h3>
        
        {history.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm italic">
            Nenhuma conquista registrada.
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((conquest, index) => (
              <button
                key={conquest.id}
                onClick={() => onShowOnMap(conquest)}
                className="w-full bg-card p-4 rounded-xl border border-border flex items-center justify-between group hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg border border-primary/20 group-hover:bg-primary/20 transition-colors">
                    <Trophy className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-bold text-sm">Conquista #{history.length - index}</span>
                </div>
                <span className="text-primary font-mono font-bold text-sm">
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
        className="mt-8 text-destructive hover:bg-destructive/10"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sair da Conta
      </Button>
    </div>
  );
}
