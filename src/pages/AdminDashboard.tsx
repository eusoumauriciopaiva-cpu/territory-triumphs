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
  Globe,
  Flame,
  MapPin,
  Crown,
  Zap,
  TrendingUp,
  Activity,
  Target,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { RANK_CONFIG } from '@/types';

type TabType = 'overview' | 'users' | 'clans';

interface DashboardStats {
  totalUsers: number;
  totalConquests: number;
  totalClans: number;
  totalArea: number;
  totalKm: number;
  activeToday: number;
}

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  nickname: string | null;
  unique_code: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  total_area: number;
  total_km: number;
  rank: string;
  current_streak: number;
  created_at: string;
}

interface ClanData {
  id: string;
  name: string;
  total_area: number;
  is_elite: boolean;
  city: string | null;
  country: string | null;
  monthly_km: number;
  member_count: number;
}

const MASTER_EMAIL = 'eusoumauriciopaiva1@gmail.com';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [clans, setClans] = useState<ClanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check access and load data
  useEffect(() => {
    async function loadDashboard() {
      // Wait for auth to finish loading
      if (authLoading) return;
      
      // Check if user is master admin
      if (!user || user.email !== MASTER_EMAIL) {
        navigate('/');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Load stats
        const [profilesRes, conquestsRes, groupsRes] = await Promise.all([
          supabase.from('profiles').select('*'),
          supabase.from('conquests').select('id, created_at'),
          supabase.from('groups').select('*, group_members(user_id)')
        ]);

        if (profilesRes.error) throw profilesRes.error;
        if (conquestsRes.error) throw conquestsRes.error;
        if (groupsRes.error) throw groupsRes.error;

        const profiles = profilesRes.data || [];
        const conquests = conquestsRes.data || [];
        const groups = groupsRes.data || [];

        // Calculate today's active users
        const today = new Date().toISOString().split('T')[0];
        const activeToday = conquests.filter(c => 
          c.created_at?.startsWith(today)
        ).length;

        setStats({
          totalUsers: profiles.length,
          totalConquests: conquests.length,
          totalClans: groups.length,
          totalArea: profiles.reduce((sum, p) => sum + (p.total_area || 0), 0),
          totalKm: profiles.reduce((sum, p) => sum + Number(p.total_km || 0), 0),
          activeToday
        });

        // Set users with ranking
        setUsers(profiles.sort((a, b) => b.total_area - a.total_area).map(p => ({
          id: p.id,
          user_id: p.user_id,
          name: p.name,
          nickname: p.nickname,
          unique_code: p.unique_code,
          avatar_url: p.avatar_url,
          level: p.level,
          xp: p.xp,
          total_area: p.total_area,
          total_km: Number(p.total_km),
          rank: p.rank,
          current_streak: p.current_streak,
          created_at: p.created_at
        })));

        // Set clans
        setClans(groups.map(g => ({
          id: g.id,
          name: g.name,
          total_area: g.total_area,
          is_elite: g.is_elite,
          city: g.city,
          country: g.country,
          monthly_km: Number(g.monthly_km),
          member_count: g.group_members?.length || 0
        })));

      } catch (err: any) {
        console.error('Dashboard error:', err);
        setError(err.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [user, authLoading, navigate]);

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <Shield className="absolute inset-0 m-auto w-8 h-8 text-primary" />
          </div>
          <p className="text-primary font-mono text-lg tracking-[0.3em] animate-pulse">
            COMANDO ZONNA
          </p>
          <p className="text-muted-foreground font-mono text-xs mt-2">
            Carregando painel de controle...
          </p>
        </div>
      </div>
    );
  }

  // Access check
  if (!user || user.email !== MASTER_EMAIL) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center">
            <Shield className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-black text-foreground mb-2 font-mono tracking-wider">
            ACESSO NEGADO
          </h1>
          <p className="text-muted-foreground font-mono text-sm mb-6">
            Área restrita ao Administrador Master
          </p>
          <Button onClick={() => navigate('/')} className="font-mono bg-primary text-black hover:bg-primary/90">
            <ArrowLeft className="w-4 h-4 mr-2" />
            VOLTAR À HOME
          </Button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center">
            <Activity className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-xl font-black text-foreground mb-2 font-mono">
            ERRO AO CARREGAR
          </h1>
          <p className="text-muted-foreground font-mono text-sm mb-6">
            {error}
          </p>
          <Button onClick={() => window.location.reload()} className="font-mono bg-primary text-black">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-primary/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight font-mono text-foreground">
                  COMANDO ZONNA
                </h1>
                <p className="text-[10px] text-primary font-mono">PAINEL DE CONTROLE MASTER</p>
              </div>
            </div>
          </div>
          
          {/* User badge */}
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/30">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-black">Z</span>
            </div>
            <span className="text-xs font-mono text-primary font-bold">ZADM</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="px-4 py-3 border-b border-border/50 bg-[#0a0a0a]">
        <div className="flex gap-2">
          {[
            { id: 'overview', label: 'VISÃO GERAL', icon: TrendingUp },
            { id: 'users', label: 'ATLETAS', icon: Users },
            { id: 'clans', label: 'CLÃS', icon: Crown },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`gap-2 font-mono text-xs ${
                activeTab === tab.id 
                  ? 'bg-primary text-black' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Button>
          ))}
        </div>
      </nav>

      <main className="p-4 pb-8">
        <AnimatePresence mode="wait">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-4 border border-primary/30">
                  <Users className="w-6 h-6 text-primary mb-2" />
                  <p className="text-3xl font-black font-mono text-foreground">{stats?.totalUsers || 0}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono mt-1">
                    ATLETAS CADASTRADOS
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-2xl p-4 border border-green-500/30">
                  <Activity className="w-6 h-6 text-green-400 mb-2" />
                  <p className="text-3xl font-black font-mono text-foreground">{stats?.activeToday || 0}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono mt-1">
                    ATIVOS HOJE
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-2xl p-4 border border-blue-500/30">
                  <Target className="w-6 h-6 text-blue-400 mb-2" />
                  <p className="text-3xl font-black font-mono text-foreground">{stats?.totalConquests || 0}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono mt-1">
                    CONQUISTAS TOTAIS
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 rounded-2xl p-4 border border-yellow-500/30">
                  <Crown className="w-6 h-6 text-yellow-400 mb-2" />
                  <p className="text-3xl font-black font-mono text-foreground">{stats?.totalClans || 0}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono mt-1">
                    CLÃS CRIADOS
                  </p>
                </div>
              </div>

              {/* Big Numbers */}
              <div className="bg-card rounded-2xl p-5 border border-border">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
                  MÉTRICAS GLOBAIS
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-4xl font-black font-mono text-primary">
                      {((stats?.totalArea || 0) / 1000).toFixed(1)}k
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">m² dominados</p>
                  </div>
                  <div>
                    <p className="text-4xl font-black font-mono text-primary">
                      {(stats?.totalKm || 0).toFixed(1)}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">km percorridos</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-card rounded-2xl p-4 border border-border">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">
                  AÇÕES RÁPIDAS
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-auto py-3 flex-col gap-2 font-mono border-primary/30 hover:bg-primary/10">
                    <Share2 className="w-5 h-5 text-primary" />
                    <span className="text-xs">GERAR RELATÓRIO</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col gap-2 font-mono border-primary/30 hover:bg-primary/10">
                    <Globe className="w-5 h-5 text-primary" />
                    <span className="text-xs">VER NO MAPA</span>
                  </Button>
                </div>
              </div>

              {/* Top Athletes Preview */}
              {users.length > 0 && (
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                      TOP ATLETAS
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('users')} className="text-primary text-xs">
                      Ver todos →
                    </Button>
                  </div>
                  <div className="divide-y divide-border/50">
                    {users.slice(0, 3).map((user, index) => (
                      <div key={user.id} className="p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-black font-bold shrink-0">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">#{user.unique_code}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary font-mono">{user.total_area.toLocaleString()} m²</p>
                          <p className="text-xs text-muted-foreground">{user.total_km.toFixed(1)} km</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h2 className="font-bold flex items-center gap-2 font-mono text-sm">
                    <Users className="w-4 h-4 text-primary" />
                    ATLETAS CADASTRADOS ({users.length})
                  </h2>
                </div>

                {users.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground font-mono">
                      Nenhum atleta cadastrado ainda
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {users.map((profile, index) => (
                      <div key={profile.id} className="p-4 hover:bg-primary/5 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            #{index + 1}
                          </div>
                          
                          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-black font-bold shrink-0">
                            {profile.avatar_url ? (
                              <img src={profile.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                            ) : (
                              profile.name.charAt(0).toUpperCase()
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold">{profile.name}</span>
                              {profile.nickname && (
                                <span className="text-xs text-primary font-mono">@{profile.nickname}</span>
                              )}
                              <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-mono">
                                {RANK_CONFIG[profile.rank as keyof typeof RANK_CONFIG]?.label || profile.rank}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-mono">
                              <span className="flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                {profile.unique_code}
                              </span>
                              <span>LVL {profile.level}</span>
                              <span className="flex items-center gap-1">
                                <Flame className="w-3 h-3 text-orange-400" />
                                {profile.current_streak}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-bold text-primary font-mono">
                              {profile.total_area.toLocaleString()} m²
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {profile.total_km.toFixed(1)} km
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* CLANS TAB */}
          {activeTab === 'clans' && (
            <motion.div
              key="clans"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h2 className="font-bold flex items-center gap-2 font-mono text-sm">
                    <Crown className="w-4 h-4 text-primary" />
                    CLÃS REGISTRADOS ({clans.length})
                  </h2>
                </div>

                {clans.length === 0 ? (
                  <div className="p-12 text-center">
                    <Crown className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground font-mono">
                      Nenhum clã criado ainda
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {clans.map((clan) => (
                      <div key={clan.id} className="p-4 hover:bg-primary/5 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            clan.is_elite 
                              ? 'bg-gradient-to-br from-yellow-500 to-amber-600' 
                              : 'bg-primary/20'
                          }`}>
                            {clan.is_elite ? (
                              <Zap className="w-6 h-6 text-black" />
                            ) : (
                              <Crown className="w-5 h-5 text-primary" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{clan.name}</span>
                              {clan.is_elite && (
                                <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-mono font-bold">
                                  ELITE
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-mono">
                              {clan.city && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {clan.city}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {clan.member_count} membros
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-bold text-primary font-mono">
                              {clan.total_area.toLocaleString()} m²
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {clan.monthly_km.toFixed(1)} km/mês
                            </p>
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
