import { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Users, 
  Crown, 
  Mail, 
  Hash, 
  Search,
  Loader2,
  Globe,
  Flame,
  MapPin,
  Zap,
  TrendingUp,
  Target,
  Eye,
  ChevronDown,
  Swords
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { RANK_CONFIG } from '@/types';
import { ZonnaMap3D } from './ZonnaMap3D';
import { AdminConflictFeed } from './AdminConflictFeed';
import type { Conquest } from '@/types';

interface DashboardStats {
  totalUsers: number;
  totalConquests: number;
  totalClans: number;
  totalArea: number;
  totalKm: number;
  activeToday: number;
}

interface UserWithEmail {
  id: string;
  user_id: string;
  email: string;
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
  last_activity_date: string | null;
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

export function AdminCommandPanel() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserWithEmail[]>([]);
  const [clans, setClans] = useState<ClanData[]>([]);
  const [allConquests, setAllConquests] = useState<Conquest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithEmail | null>(null);

  // Load all admin data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch profiles with emails using RPC function (admin only)
        const { data: profilesWithEmail, error: rpcError } = await supabase
          .rpc('get_all_profiles_admin');

        if (rpcError) {
          console.error('RPC error:', rpcError);
          // Fallback to regular profiles without emails
          const { data: profiles } = await supabase.from('profiles').select('*');
          if (profiles) {
            setUsers(profiles.map(p => ({ ...p, email: 'N/A', total_km: Number(p.total_km) })));
          }
        } else if (profilesWithEmail) {
          setUsers(profilesWithEmail.map((p: any) => ({
            ...p,
            total_km: Number(p.total_km)
          })));
        }

        // Fetch conquests
        const { data: conquests } = await supabase.from('conquests').select('*');
        if (conquests) {
          const parsedConquests = conquests.map(c => ({
            ...c,
            path: typeof c.path === 'string' ? JSON.parse(c.path) : c.path
          }));
          setAllConquests(parsedConquests);
        }

        // Fetch groups/clans
        const { data: groups } = await supabase
          .from('groups')
          .select('*, group_members(user_id)');
        
        if (groups) {
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
        }

        // Calculate stats
        const today = new Date().toISOString().split('T')[0];
        const activeToday = conquests?.filter(c => 
          c.created_at?.startsWith(today)
        ).length || 0;

        const profiles = profilesWithEmail || [];
        setStats({
          totalUsers: profiles.length,
          totalConquests: conquests?.length || 0,
          totalClans: groups?.length || 0,
          totalArea: profiles.reduce((sum: number, p: any) => sum + (p.total_area || 0), 0),
          totalKm: profiles.reduce((sum: number, p: any) => sum + Number(p.total_km || 0), 0),
          activeToday
        });

      } catch (err) {
        console.error('Admin load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(u => 
      u.email?.toLowerCase().includes(q) ||
      u.name?.toLowerCase().includes(q) ||
      u.nickname?.toLowerCase().includes(q) ||
      u.unique_code?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  // Check if user is active (activity in last 7 days)
  const isUserActive = (lastActivity: string | null) => {
    if (!lastActivity) return false;
    const lastDate = new Date(lastActivity);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return lastDate >= sevenDaysAgo;
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-primary/30 p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="text-primary font-mono text-sm">CARREGANDO COMANDO...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl p-4 border border-primary/30">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="font-black text-lg tracking-tight font-mono text-foreground">
              COMANDO ZONNA
            </h2>
            <p className="text-[10px] text-primary font-mono uppercase">
              Painel de Controle Master
            </p>
          </div>
        </div>
      </div>

      <Accordion type="multiple" className="space-y-3">
        {/* METRICS SECTION */}
        <AccordionItem value="metrics" className="bg-card rounded-2xl border border-border overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="font-mono font-bold text-sm">MÉTRICAS DA PLATAFORMA</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-3 border border-primary/30">
                <Users className="w-5 h-5 text-primary mb-1" />
                <p className="text-2xl font-black font-mono">{stats?.totalUsers || 0}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">Total Atletas</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl p-3 border border-green-500/30">
                <Zap className="w-5 h-5 text-green-400 mb-1" />
                <p className="text-2xl font-black font-mono">{stats?.activeToday || 0}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">Ativos Hoje</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-xl p-3 border border-blue-500/30">
                <Target className="w-5 h-5 text-blue-400 mb-1" />
                <p className="text-2xl font-black font-mono">{stats?.totalConquests || 0}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">Conquistas</p>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 rounded-xl p-3 border border-yellow-500/30">
                <Crown className="w-5 h-5 text-yellow-400 mb-1" />
                <p className="text-2xl font-black font-mono">{stats?.totalClans || 0}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-mono">Clãs Criados</p>
              </div>
            </div>

            {/* Global Numbers */}
            <div className="bg-muted/50 rounded-xl p-4 border border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-3xl font-black font-mono text-primary">
                    {((stats?.totalArea || 0) / 1000).toFixed(1)}k
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">m² dominados</p>
                </div>
                <div>
                  <p className="text-3xl font-black font-mono text-primary">
                    {(stats?.totalKm || 0).toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">km percorridos</p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* HEATMAP SECTION */}
        <AccordionItem value="heatmap" className="bg-card rounded-2xl border border-border overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary" />
              <span className="font-mono font-bold text-sm">MAPA DE CALOR GLOBAL</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <Button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className="w-full mb-3 bg-primary text-black font-mono"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showHeatmap ? 'OCULTAR MAPA' : 'EXIBIR MAPA GLOBAL'}
            </Button>
            
            {showHeatmap && (
              <div className="h-64 rounded-xl overflow-hidden border border-primary/30">
                <ZonnaMap3D
                  userPosition={allConquests.length > 0 ? allConquests[0].path[0] : null}
                  heatmapMode={true}
                  trailColor="#FF4F00"
                  userConquests={allConquests}
                />
              </div>
            )}
            
            {!showHeatmap && (
              <p className="text-xs text-muted-foreground text-center font-mono">
                Visualize todos os {allConquests.length} territórios conquistados
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* USERS MANAGEMENT SECTION */}
        <AccordionItem value="users" className="bg-card rounded-2xl border border-border overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-mono font-bold text-sm">GESTÃO DE USUÁRIOS ({users.length})</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4">
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por e-mail, nick ou código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-border font-mono text-sm"
              />
            </div>

            {/* User List */}
            <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-hide">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground font-mono text-sm">
                    {searchQuery ? 'Nenhum usuário encontrado' : 'Nenhum atleta cadastrado'}
                  </p>
                </div>
              ) : (
                filteredUsers.map((user, index) => (
                  <div 
                    key={user.id} 
                    className="bg-muted/30 rounded-xl p-3 border border-border hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank Number */}
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">
                        {index + 1}
                      </div>
                      
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-black font-bold shrink-0">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm truncate">{user.name}</span>
                          {/* Activity Status */}
                          <span className={`w-2 h-2 rounded-full ${
                            isUserActive(user.last_activity_date) ? 'bg-green-400' : 'bg-muted-foreground'
                          }`} />
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                          <Hash className="w-3 h-3" />
                          <span>{user.unique_code}</span>
                          {user.nickname && (
                            <>
                              <span>•</span>
                              <span className="text-primary">@{user.nickname}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-primary font-mono">
                          {user.total_area.toLocaleString()} m²
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {user.total_km.toFixed(1)} km
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* CLANS MANAGEMENT SECTION */}
        <AccordionItem value="clans" className="bg-card rounded-2xl border border-border overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-primary" />
              <span className="font-mono font-bold text-sm">GESTÃO DE CLÃS ({clans.length})</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4">
            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
              {clans.length === 0 ? (
                <div className="text-center py-8">
                  <Crown className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground font-mono text-sm">Nenhum clã criado</p>
                </div>
              ) : (
                clans.map((clan) => (
                  <div key={clan.id} className="bg-muted/30 rounded-xl p-3 border border-border">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        clan.is_elite 
                          ? 'bg-gradient-to-br from-yellow-500 to-amber-600' 
                          : 'bg-primary/20'
                      }`}>
                        {clan.is_elite ? (
                          <Zap className="w-5 h-5 text-black" />
                        ) : (
                          <Crown className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{clan.name}</span>
                          {clan.is_elite && (
                            <span className="text-[8px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full font-mono font-bold">
                              ELITE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                          <Users className="w-3 h-3" />
                          <span>{clan.member_count} membros</span>
                          {clan.city && (
                            <>
                              <MapPin className="w-3 h-3" />
                              <span>{clan.city}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-primary font-mono">
                          {clan.total_area.toLocaleString()} m²
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {clan.monthly_km.toFixed(1)} km/mês
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* CONFLICTS SECTION */}
        <AccordionItem value="conflicts" className="bg-card rounded-2xl border border-destructive/30 overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3">
              <Swords className="w-5 h-5 text-destructive" />
              <span className="font-mono font-bold text-sm">CONFLITOS TERRITORIAIS</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4">
            <AdminConflictFeed />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="bg-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="font-mono flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              DETALHES DO ATLETA
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              {/* Avatar & Basic Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-black font-bold text-2xl">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    selectedUser.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-black text-lg">{selectedUser.name}</h3>
                  {selectedUser.nickname && (
                    <p className="text-primary font-mono text-sm">@{selectedUser.nickname}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${
                      isUserActive(selectedUser.last_activity_date) ? 'bg-green-400' : 'bg-muted-foreground'
                    }`} />
                    <span className="text-xs text-muted-foreground font-mono">
                      {isUserActive(selectedUser.last_activity_date) ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-xl p-3 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">E-mail</p>
                  <p className="text-sm font-mono truncate">{selectedUser.email}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">Z-ID</p>
                  <p className="text-sm font-mono text-primary">#{selectedUser.unique_code}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">Rank</p>
                  <p className="text-sm font-mono">
                    {RANK_CONFIG[selectedUser.rank as keyof typeof RANK_CONFIG]?.label || selectedUser.rank}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">Nível</p>
                  <p className="text-sm font-mono">{selectedUser.level}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-primary/10 rounded-xl p-4 border border-primary/30">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xl font-black font-mono text-primary">{selectedUser.total_area.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">m²</p>
                  </div>
                  <div>
                    <p className="text-xl font-black font-mono">{selectedUser.total_km.toFixed(1)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">km</p>
                  </div>
                  <div>
                    <p className="text-xl font-black font-mono text-orange-400 flex items-center justify-center gap-1">
                      <Flame className="w-4 h-4" />
                      {selectedUser.current_streak}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">streak</p>
                  </div>
                </div>
              </div>

              {/* Joined Date */}
              <p className="text-xs text-muted-foreground text-center font-mono">
                Membro desde {new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
