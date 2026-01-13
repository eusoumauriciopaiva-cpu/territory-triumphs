import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Trophy, Mail, Hash, Calendar, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useIsDeveloper, useAdminProfiles } from '@/hooks/useDeveloper';
import { RANK_CONFIG } from '@/types';

export default function DevDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: isDeveloper, isLoading: devLoading } = useIsDeveloper();
  const { data: profiles, isLoading: profilesLoading } = useAdminProfiles();

  // Redirect if not authenticated or not developer
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
      return;
    }
    
    if (!devLoading && isDeveloper === false) {
      navigate('/');
    }
  }, [authLoading, user, devLoading, isDeveloper, navigate]);

  if (authLoading || devLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!isDeveloper) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-black tracking-tighter">Developer Dashboard</h1>
          </div>
        </div>
      </header>

      <main className="p-4 pb-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <Users className="w-6 h-6 text-primary mb-2" />
            <p className="text-2xl font-black">{profiles?.length || 0}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Usuários</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <Trophy className="w-6 h-6 text-primary mb-2" />
            <p className="text-2xl font-black">
              {profiles?.reduce((sum, p) => sum + p.total_area, 0).toLocaleString() || 0}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Área Total (m²)</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Usuários Cadastrados
            </h2>
          </div>

          {profilesLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Carregando usuários...</p>
            </div>
          ) : profiles?.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Nenhum usuário cadastrado ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {profiles?.map((profile) => (
                <div key={profile.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-black font-bold shrink-0">
                      {profile.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt={profile.name}
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        profile.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">{profile.name}</span>
                        {profile.nickname && (
                          <span className="text-xs text-primary">@{profile.nickname}</span>
                        )}
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          {RANK_CONFIG[profile.rank as keyof typeof RANK_CONFIG]?.label || profile.rank}
                        </span>
                      </div>

                      {/* Email */}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{profile.email}</span>
                      </div>

                      {/* Code and Stats */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {profile.unique_code}
                        </span>
                        <span>Nível {profile.level}</span>
                        <span>{profile.xp} XP</span>
                        <span className="text-primary">{profile.total_area.toLocaleString()} m²</span>
                        <span>{Number(profile.total_km).toFixed(1)} km</span>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        Cadastro: {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
