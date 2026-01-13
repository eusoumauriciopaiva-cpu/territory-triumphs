import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Trophy, 
  Mail, 
  Hash, 
  Calendar, 
  ArrowLeft, 
  Loader2,
  Map,
  Filter,
  Globe,
  Flame,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin, useAdminProfiles, useAdminConquests, useAdminGroups } from '@/hooks/useAdmin';
import { RANK_CONFIG } from '@/types';
import { AdminGlobalMap } from '@/components/AdminGlobalMap';
import { MapStyleToggle } from '@/components/MapStyleToggle';
import type { MapStyleType } from '@/lib/mapStyle';

type TabType = 'map' | 'users';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: profiles, isLoading: profilesLoading } = useAdminProfiles();
  const { data: conquests, isLoading: conquestsLoading } = useAdminConquests();
  const { data: groups } = useAdminGroups();
  
  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [mapStyle, setMapStyle] = useState<MapStyleType>('dark');

  // Redirect if not authenticated or not the master admin
  // SECURITY: Only eusoumauriciopaiva1@gmail.com can access this dashboard
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
      return;
    }
    
    // Block access if not admin or email doesn't match
    if (!adminLoading && (isAdmin === false || user?.email !== 'eusoumauriciopaiva1@gmail.com')) {
      navigate('/');
    }
  }, [authLoading, user, adminLoading, isAdmin, navigate]);

  // Get filtered user IDs based on selected group
  const getFilteredUserIds = (): string[] | undefined => {
    if (selectedGroupId === 'all' || !groups) return undefined;
    
    const group = groups.find(g => g.id === selectedGroupId);
    if (!group) return undefined;
    
    return group.group_members?.map((m: any) => m.user_id) || [];
  };

  // Show loading state
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-mono text-sm tracking-wider">
            VERIFICANDO ACESSO...
          </p>
        </div>
      </div>
    );
  }

  // Show access denied message instead of blank page
  if (!isAdmin || user?.email !== 'eusoumauriciopaiva1@gmail.com') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-black text-foreground mb-2 font-mono">
            ACESSO NEGADO
          </h1>
          <p className="text-muted-foreground font-mono text-sm mb-6">
            Área restrita ao Administrador Master
          </p>
          <Button onClick={() => navigate('/')} className="font-mono">
            <ArrowLeft className="w-4 h-4 mr-2" />
            VOLTAR
          </Button>
        </div>
      </div>
    );
  }

  const totalArea = profiles?.reduce((sum, p) => sum + p.total_area, 0) || 0;
  const totalKm = profiles?.reduce((sum, p) => sum + Number(p.total_km), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-primary/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-black tracking-tighter font-mono">
                COMANDO <span className="text-primary">ZONNA</span>
              </h1>
            </div>
          </div>
          
          {/* Tab switcher */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('map')}
              className="gap-2 font-mono"
            >
              <Globe className="w-4 h-4" />
              MAPA
            </Button>
            <Button
              variant={activeTab === 'users' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('users')}
              className="gap-2 font-mono"
            >
              <Users className="w-4 h-4" />
              ATLETAS
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 pb-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-card rounded-xl p-3 border border-primary/20">
            <Users className="w-5 h-5 text-primary mb-1" />
            <p className="text-xl font-black font-mono">{profiles?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
              ATLETAS
            </p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-primary/20">
            <MapPin className="w-5 h-5 text-primary mb-1" />
            <p className="text-xl font-black font-mono">{conquests?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
              CONQUISTAS
            </p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-primary/20">
            <Trophy className="w-5 h-5 text-primary mb-1" />
            <p className="text-xl font-black font-mono">
              {(totalArea / 1000).toFixed(0)}k
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
              M² TOTAL
            </p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-primary/20">
            <Flame className="w-5 h-5 text-primary mb-1" />
            <p className="text-xl font-black font-mono">{totalKm.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
              KM TOTAL
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Map Controls */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger className="w-[200px] bg-card border-primary/20 font-mono text-sm">
                      <SelectValue placeholder="Filtrar por Clã" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Clãs</SelectItem>
                      {groups?.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name} {group.is_elite && '⚡'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <MapStyleToggle currentStyle={mapStyle} onStyleChange={setMapStyle} />
              </div>

              {/* Global Map */}
              <div className="h-[60vh] bg-card rounded-xl border border-primary/20 overflow-hidden relative">
                {conquestsLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-muted-foreground font-mono text-sm">
                        CARREGANDO HEATMAP GLOBAL...
                      </p>
                    </div>
                  </div>
                ) : conquests?.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground font-mono text-sm">
                        NENHUM TERRITÓRIO CONQUISTADO
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Os rastros aparecerão quando atletas começarem a correr
                      </p>
                    </div>
                  </div>
                ) : (
                  <AdminGlobalMap 
                    conquests={conquests || []} 
                    filterUserIds={getFilteredUserIds()}
                    mapStyle={mapStyle}
                  />
                )}
                
                {/* Map overlay info */}
                <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-primary/30">
                  <p className="text-xs font-mono text-primary">
                    {conquests?.length || 0} TERRITÓRIOS MAPEADOS
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Users Table */}
              <div className="bg-card rounded-xl border border-primary/20 overflow-hidden">
                <div className="p-4 border-b border-primary/20">
                  <h2 className="font-bold flex items-center gap-2 font-mono">
                    <Users className="w-4 h-4 text-primary" />
                    ATLETAS CADASTRADOS
                  </h2>
                </div>

                {profilesLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm font-mono">
                      CARREGANDO ATLETAS...
                    </p>
                  </div>
                ) : profiles?.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm font-mono">
                      NENHUM ATLETA CADASTRADO
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-primary/10">
                    {profiles?.map((profile) => (
                      <div 
                        key={profile.id} 
                        className="p-4 hover:bg-primary/5 transition-colors"
                      >
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
                              <span className="font-bold font-mono">{profile.name}</span>
                              {profile.nickname && (
                                <span className="text-xs text-primary font-mono">
                                  @{profile.nickname}
                                </span>
                              )}
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-mono">
                                {RANK_CONFIG[profile.rank as keyof typeof RANK_CONFIG]?.label || profile.rank}
                              </span>
                            </div>

                            {/* Email */}
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <Mail className="w-3 h-3" />
                              <span className="truncate font-mono text-xs">{profile.email}</span>
                            </div>

                            {/* Code and Stats */}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap font-mono">
                              <span className="flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                {profile.unique_code}
                              </span>
                              <span>LVL {profile.level}</span>
                              <span>{profile.xp} XP</span>
                              <span className="text-primary font-bold">
                                {profile.total_area.toLocaleString()} m²
                              </span>
                              <span>{Number(profile.total_km).toFixed(1)} km</span>
                            </div>

                            {/* Date */}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 font-mono">
                              <Calendar className="w-3 h-3" />
                              {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
