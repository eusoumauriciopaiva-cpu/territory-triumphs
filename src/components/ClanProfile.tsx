import { useState, useEffect } from 'react';
import { X, Users, Trophy, Crown, Zap, MapPin, Share2 } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { EloBadge } from './EloSystem';
import type { Group, Profile, Conquest } from '@/types';

interface ClanProfileProps {
  group: Group | null;
  isOpen: boolean;
  onClose: () => void;
  onViewMember: (userId: string) => void;
}

interface ClanMember extends Profile {
  weekly_area?: number;
  weekly_km?: number;
}

export function ClanProfile({ group, isOpen, onClose, onViewMember }: ClanProfileProps) {
  const [members, setMembers] = useState<ClanMember[]>([]);
  const [conquests, setConquests] = useState<Conquest[]>([]);
  const [leader, setLeader] = useState<ClanMember | null>(null);
  const [topRunner, setTopRunner] = useState<ClanMember | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!group || !isOpen) return;

    const fetchClanData = async () => {
      setLoading(true);
      try {
        // Fetch members
        const { data: memberData } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', group.id);

        if (memberData) {
          const memberIds = memberData.map(m => m.user_id);
          
          // Fetch profiles
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('user_id', memberIds);

          // Calculate weekly stats
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);

          const { data: weeklyConquests } = await supabase
            .from('conquests')
            .select('*')
            .in('user_id', memberIds)
            .gte('created_at', weekAgo.toISOString());

          // Calculate per-member weekly stats
          const memberStats: Record<string, { area: number; km: number }> = {};
          (weeklyConquests || []).forEach(c => {
            if (!memberStats[c.user_id]) {
              memberStats[c.user_id] = { area: 0, km: 0 };
            }
            memberStats[c.user_id].area += c.area;
            memberStats[c.user_id].km += Number(c.distance);
          });

          const enhancedMembers = (profiles || []).map(p => ({
            ...p,
            weekly_area: memberStats[p.user_id]?.area || 0,
            weekly_km: memberStats[p.user_id]?.km || 0,
          })) as ClanMember[];

          setMembers(enhancedMembers);

          // Find leader (creator or highest XP)
          const creatorProfile = enhancedMembers.find(m => m.user_id === group.created_by);
          setLeader(creatorProfile || enhancedMembers.sort((a, b) => b.xp - a.xp)[0] || null);

          // Find top runner of the week
          const sorted = [...enhancedMembers].sort((a, b) => (b.weekly_km || 0) - (a.weekly_km || 0));
          setTopRunner(sorted[0] || null);

          // Fetch all conquests for heatmap
          const { data: allConquests } = await supabase
            .from('conquests')
            .select('*')
            .in('user_id', memberIds);

          setConquests((allConquests || []).map(c => ({
            ...c,
            path: c.path as [number, number][],
          })));
        }
      } catch (error) {
        console.error('Error fetching clan data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClanData();
  }, [group, isOpen]);

  if (!group) return null;

  const isElite = (group as any).is_elite;
  const monthlyKm = (group as any).monthly_km || 0;
  const eliteProgress = Math.min(100, (monthlyKm / 500) * 100);

  const handleShare = () => {
    const text = `Junte-se ao clã ${group.name} no ZONNA! ${window.location.href}`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass border-border max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className={cn(
          'relative p-6 border-b border-border',
          isElite ? 'bg-gradient-to-br from-primary/20 to-transparent' : ''
        )}>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4"
          >
            <X className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-4">
            <div 
              className={cn(
                'w-20 h-20 rounded-2xl flex items-center justify-center font-black text-3xl rotate-3',
                isElite 
                  ? 'bg-gradient-to-br from-primary to-yellow-500 ring-4 ring-primary/30' 
                  : 'bg-gradient-neon'
              )}
            >
              {group.name.slice(0, 2).toUpperCase()}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-black">{group.name}</h2>
                {isElite && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-black flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    ELITE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {members.length} membros
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {group.total_area.toLocaleString()} m²
                </span>
              </div>
            </div>
          </div>

          {/* Elite Progress */}
          {!isElite && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progresso Elite</span>
                <span className="text-primary font-bold">{monthlyKm.toFixed(1)}/500 km</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-neon transition-all duration-500"
                  style={{ width: `${eliteProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Leader & Top Runner */}
          <div className="grid grid-cols-2 gap-4">
            {leader && (
              <div 
                className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => onViewMember(leader.user_id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Líder
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-neon flex items-center justify-center font-bold">
                    {leader.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold">{leader.name}</p>
                    <EloBadge rank={leader.rank} size="sm" showLabel={false} />
                  </div>
                </div>
              </div>
            )}

            {topRunner && (
              <div 
                className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => onViewMember(topRunner.user_id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Top Semana
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-neon flex items-center justify-center font-bold">
                    {topRunner.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold">{topRunner.name}</p>
                    <p className="text-xs text-primary">
                      {(topRunner.weekly_km || 0).toFixed(1)} km
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Heatmap Placeholder */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              HEATMAP DO CLÃ
            </h3>
            <div className="h-40 bg-background rounded-lg flex items-center justify-center relative overflow-hidden">
              {/* Mini heatmap visualization */}
              <div className="absolute inset-0 opacity-40">
                {conquests.slice(0, 20).map((c, i) => (
                  <div
                    key={c.id}
                    className="absolute w-8 h-8 rounded-full bg-primary blur-xl"
                    style={{
                      left: `${(i * 17) % 80 + 10}%`,
                      top: `${(i * 23) % 60 + 20}%`,
                      opacity: 0.3 + (i * 0.05),
                    }}
                  />
                ))}
              </div>
              <p className="text-muted-foreground text-sm z-10">
                {conquests.length} territórios conquistados
              </p>
            </div>
          </div>

          {/* Members List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              MEMBROS ({members.length})
            </h3>
            <div className="space-y-2">
              {members.map(member => (
                <button
                  key={member.id}
                  onClick={() => onViewMember(member.user_id)}
                  className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-neon flex items-center justify-center font-bold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{member.name}</span>
                      <EloBadge rank={member.rank} size="sm" showLabel={false} />
                      {member.user_id === group.created_by && (
                        <Crown className="w-3 h-3 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{member.total_area.toLocaleString()} m²</span>
                      <span>{Number(member.total_km).toFixed(1)} km</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button onClick={handleShare} variant="outline" className="w-full">
            <Share2 className="w-4 h-4 mr-2" />
            Convidar para o Clã
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
