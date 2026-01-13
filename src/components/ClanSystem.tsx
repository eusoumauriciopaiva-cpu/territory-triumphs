import { useState, useEffect } from 'react';
import { Search, Users, Trophy, Crown, Zap, MapPin, Globe, Flag, Star, ChevronRight, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { cn } from '@/lib/utils';
import type { Group, Profile } from '@/types';
import { EloBadge } from './EloSystem';

interface ClanSystemProps {
  groups: Group[];
  myMemberships: string[];
  profiles: Profile[];
  onCreateGroup: (name: string) => void;
  onJoinGroup: (groupId: string) => void;
  onLeaveGroup: (groupId: string) => void;
  onViewProfile: (userId: string) => void;
  onViewClan: (groupId: string) => void;
}

type RankingFilter = 'global' | 'national' | 'local';

export function ClanSystem({
  groups,
  myMemberships,
  profiles,
  onCreateGroup,
  onJoinGroup,
  onLeaveGroup,
  onViewProfile,
  onViewClan,
}: ClanSystemProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ 
    clans: Group[]; 
    warriors: Profile[];
  }>({ clans: [], warriors: [] });
  const [rankingFilter, setRankingFilter] = useState<RankingFilter>('global');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newClanName, setNewClanName] = useState('');

  // Search logic
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults({ clans: [], warriors: [] });
      return;
    }

    const query = searchQuery.toLowerCase();
    const matchedClans = groups.filter(g => 
      g.name.toLowerCase().includes(query)
    );
    const matchedWarriors = profiles.filter(p => 
      p.name.toLowerCase().includes(query)
    );

    setSearchResults({ clans: matchedClans, warriors: matchedWarriors });
  }, [searchQuery, groups, profiles]);

  const handleCreateClan = () => {
    if (newClanName.trim()) {
      onCreateGroup(newClanName.trim());
      setNewClanName('');
      setIsCreateOpen(false);
    }
  };

  // Sort groups by total_area for ranking
  const rankedGroups = [...groups].sort((a, b) => b.total_area - a.total_area);
  const topThree = rankedGroups.slice(0, 3);
  const restOfRanking = rankedGroups.slice(3);

  const myClans = groups.filter(g => myMemberships.includes(g.id));
  const otherClans = groups.filter(g => !myMemberships.includes(g.id));

  return (
    <div className="h-full overflow-y-auto pb-24">
      {/* Header with Search */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-2xl font-black tracking-tighter flex-1">CLÃS</h1>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-neon glow-neon font-bold">
                <Shield className="w-4 h-4 mr-2" />
                CRIAR CLÃ
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border">
              <DialogHeader>
                <DialogTitle className="font-black text-xl">FUNDAR NOVO CLÃ</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Nome do Clã"
                  value={newClanName}
                  onChange={(e) => setNewClanName(e.target.value)}
                  className="bg-card border-border text-lg font-bold"
                />
                <Button onClick={handleCreateClan} className="w-full bg-gradient-neon font-black">
                  FUNDAR CLÃ
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Global Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar Guerreiros ou Clãs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        {/* Search Results Dropdown */}
        {(searchResults.clans.length > 0 || searchResults.warriors.length > 0) && (
          <div className="absolute left-4 right-4 top-full mt-2 bg-card border border-border rounded-xl shadow-xl z-20 max-h-80 overflow-y-auto">
            {searchResults.warriors.length > 0 && (
              <div className="p-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  GUERREIROS
                </p>
                {searchResults.warriors.map(warrior => (
                  <button
                    key={warrior.id}
                    onClick={() => {
                      onViewProfile(warrior.user_id);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-neon flex items-center justify-center font-black">
                      {warrior.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-bold">{warrior.name}</span>
                      <div className="flex items-center gap-2">
                        <EloBadge rank={warrior.rank} size="sm" showLabel={false} />
                        <span className="text-xs text-muted-foreground">
                          {warrior.total_area.toLocaleString()} m²
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
            {searchResults.clans.length > 0 && (
              <div className="p-3 border-t border-border">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  CLÃS
                </p>
                {searchResults.clans.map(clan => (
                  <button
                    key={clan.id}
                    onClick={() => {
                      onViewClan(clan.id);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ClanBadge name={clan.name} isElite={(clan as any).is_elite} />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{clan.name}</span>
                        {(clan as any).is_elite && (
                          <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-black">
                            ELITE
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {clan.member_count} membros • {clan.total_area.toLocaleString()} m²
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Tabs defaultValue="my-clans" className="p-4">
        <TabsList className="w-full bg-card border border-border">
          <TabsTrigger value="my-clans" className="flex-1 font-bold">MEUS CLÃS</TabsTrigger>
          <TabsTrigger value="ranking" className="flex-1 font-bold">RANKING</TabsTrigger>
          <TabsTrigger value="discover" className="flex-1 font-bold">DESCOBRIR</TabsTrigger>
        </TabsList>

        {/* My Clans Tab */}
        <TabsContent value="my-clans" className="mt-4 space-y-4">
          {myClans.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-bold mb-2">Você não pertence a nenhum Clã</p>
              <p className="text-muted-foreground text-sm mb-4">
                Junte-se a um clã para ver os territórios dos aliados
              </p>
              <Button onClick={() => setIsCreateOpen(true)} className="bg-gradient-neon">
                Fundar um Clã
              </Button>
            </div>
          ) : (
            myClans.map(clan => (
              <ClanCard
                key={clan.id}
                clan={clan}
                isMember
                onLeave={() => onLeaveGroup(clan.id)}
                onView={() => onViewClan(clan.id)}
              />
            ))
          )}
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="mt-4 space-y-4">
          {/* Ranking Filters */}
          <div className="flex gap-2">
            <Button
              variant={rankingFilter === 'local' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRankingFilter('local')}
              className={cn(
                rankingFilter === 'local' && 'bg-gradient-neon border-0'
              )}
            >
              <MapPin className="w-4 h-4 mr-1" />
              Local
            </Button>
            <Button
              variant={rankingFilter === 'national' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRankingFilter('national')}
              className={cn(
                rankingFilter === 'national' && 'bg-gradient-neon border-0'
              )}
            >
              <Flag className="w-4 h-4 mr-1" />
              Nacional
            </Button>
            <Button
              variant={rankingFilter === 'global' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRankingFilter('global')}
              className={cn(
                rankingFilter === 'global' && 'bg-gradient-neon border-0'
              )}
            >
              <Globe className="w-4 h-4 mr-1" />
              Global
            </Button>
          </div>

          {/* Podium */}
          {topThree.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                PÓDIO
              </h3>
              <div className="flex items-end justify-center gap-4">
                {/* 2nd Place */}
                {topThree[1] && (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-b from-gray-300 to-gray-400 rounded-xl flex items-center justify-center font-black text-black text-xl mb-2">
                      {topThree[1].name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center font-black text-black -mt-4 z-10 border-2 border-background">
                      2
                    </div>
                    <p className="text-sm font-bold mt-2 truncate max-w-[80px]">{topThree[1].name}</p>
                    <p className="text-xs text-muted-foreground">
                      {topThree[1].total_area.toLocaleString()} m²
                    </p>
                  </div>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                  <div className="flex flex-col items-center -mt-4">
                    <Crown className="w-8 h-8 text-yellow-500 mb-1 animate-bounce" />
                    <div className="w-20 h-20 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center font-black text-black text-2xl mb-2 ring-4 ring-yellow-500/30">
                      {topThree[0].name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center font-black text-black -mt-4 z-10 border-2 border-background">
                      1
                    </div>
                    <p className="text-sm font-bold mt-2 truncate max-w-[100px]">{topThree[0].name}</p>
                    <p className="text-xs text-primary font-bold">
                      {topThree[0].total_area.toLocaleString()} m²
                    </p>
                  </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-b from-amber-600 to-amber-700 rounded-xl flex items-center justify-center font-black text-white text-xl mb-2">
                      {topThree[2].name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center font-black text-white -mt-4 z-10 border-2 border-background">
                      3
                    </div>
                    <p className="text-sm font-bold mt-2 truncate max-w-[80px]">{topThree[2].name}</p>
                    <p className="text-xs text-muted-foreground">
                      {topThree[2].total_area.toLocaleString()} m²
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rest of Ranking */}
          <div className="space-y-2">
            {restOfRanking.map((clan, index) => (
              <div 
                key={clan.id}
                className="bg-card rounded-xl border border-border p-3 flex items-center gap-3"
              >
                <span className="w-8 h-8 bg-muted rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 4}
                </span>
                <ClanBadge name={clan.name} isElite={(clan as any).is_elite} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold truncate">{clan.name}</span>
                    {(clan as any).is_elite && (
                      <Zap className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {clan.total_area.toLocaleString()} m² • {(clan as any).monthly_km?.toFixed(1) || 0} km/mês
                  </span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Discover Tab */}
        <TabsContent value="discover" className="mt-4 space-y-4">
          {otherClans.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-bold">Nenhum clã disponível</p>
              <p className="text-muted-foreground text-sm">
                Seja o primeiro a criar um clã!
              </p>
            </div>
          ) : (
            otherClans.map(clan => (
              <ClanCard
                key={clan.id}
                clan={clan}
                isMember={false}
                onJoin={() => onJoinGroup(clan.id)}
                onView={() => onViewClan(clan.id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ClanBadgeProps {
  name: string;
  isElite?: boolean;
  size?: 'sm' | 'md';
}

function ClanBadge({ name, isElite = false, size = 'md' }: ClanBadgeProps) {
  const sizeClasses = size === 'sm' ? 'w-10 h-10 text-sm' : 'w-14 h-14 text-lg';
  
  return (
    <div 
      className={cn(
        'rounded-xl flex items-center justify-center font-black rotate-3',
        sizeClasses,
        isElite 
          ? 'bg-gradient-to-br from-primary to-yellow-500 ring-2 ring-primary/50' 
          : 'bg-gradient-neon'
      )}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

interface ClanCardProps {
  clan: Group;
  isMember: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
  onView: () => void;
}

function ClanCard({ clan, isMember, onJoin, onLeave, onView }: ClanCardProps) {
  const isElite = (clan as any).is_elite;
  const monthlyKm = (clan as any).monthly_km || 0;

  return (
    <div 
      className={cn(
        'bg-card rounded-2xl border p-4',
        isElite ? 'border-primary/50 bg-primary/5' : 'border-border'
      )}
    >
      <div className="flex items-center gap-4">
        <ClanBadge name={clan.name} isElite={isElite} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-black text-lg truncate">{clan.name}</span>
            {isElite && (
              <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                <Zap className="w-3 h-3" />
                ELITE
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {clan.member_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {clan.total_area.toLocaleString()} m²
            </span>
            <span className="flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              {monthlyKm.toFixed(1)} km/mês
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onView}
          className="flex-1"
        >
          Ver Perfil
        </Button>
        {isMember ? (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onLeave}
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            Sair
          </Button>
        ) : (
          <Button 
            size="sm"
            onClick={onJoin}
            className="bg-gradient-neon font-bold"
          >
            ENTRAR
          </Button>
        )}
      </div>
    </div>
  );
}
