import { useState } from 'react';
import { Plus, Users, Share2, LogIn, LogOut, Crown, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { UserSearch } from './UserSearch';
import { VisitableProfile } from './VisitableProfile';
import type { Group, Profile } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface GroupsScreenProps {
  groups: Group[];
  myMemberships: string[];
  onCreateGroup: (name: string) => void;
  onJoinGroup: (groupId: string) => void;
  onLeaveGroup: (groupId: string) => void;
  onChallengeUser?: (userId: string) => void;
}

export function GroupsScreen({ 
  groups, 
  myMemberships, 
  onCreateGroup, 
  onJoinGroup, 
  onLeaveGroup,
  onChallengeUser
}: GroupsScreenProps) {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [activeTab, setActiveTab] = useState<'groups' | 'athletes'>('groups');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const handleCreate = () => {
    if (newGroupName.trim()) {
      onCreateGroup(newGroupName.trim());
      setNewGroupName('');
      setIsDialogOpen(false);
    }
  };

  const handleShare = () => {
    const text = `Junte-se a mim no Territory Capture! ${window.location.href}`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  const handleSelectUser = (profile: Profile) => {
    setSelectedProfile(profile);
  };

  const handleChallenge = () => {
    if (selectedProfile && onChallengeUser) {
      onChallengeUser(selectedProfile.user_id);
    }
    setSelectedProfile(null);
  };

  const myGroups = groups.filter(g => myMemberships.includes(g.id));
  const otherGroups = groups.filter(g => !myMemberships.includes(g.id));

  return (
    <div className="p-4 pb-24 overflow-y-auto h-full">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black tracking-tighter">Comunidade</h1>
        
        {activeTab === 'groups' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="bg-gradient-neon rounded-xl glow-neon">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border">
              <DialogHeader>
                <DialogTitle className="font-black">Criar Novo Grupo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Nome do grupo"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="bg-card border-border"
                />
                <Button onClick={handleCreate} className="w-full bg-gradient-neon">
                  Criar Grupo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-4 p-1 bg-card rounded-xl border border-border">
        <button
          onClick={() => setActiveTab('groups')}
          className={cn(
            'flex-1 py-2.5 px-4 rounded-lg font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2',
            activeTab === 'groups'
              ? 'bg-primary text-black'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Users className="w-4 h-4" />
          Grupos
        </button>
        <button
          onClick={() => setActiveTab('athletes')}
          className={cn(
            'flex-1 py-2.5 px-4 rounded-lg font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2',
            activeTab === 'athletes'
              ? 'bg-primary text-black'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Search className="w-4 h-4" />
          Atletas
        </button>
      </div>

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <>
          {/* My Groups */}
          {myGroups.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Meus Grupos
              </h2>
              <div className="space-y-3">
                {myGroups.map((group) => (
                  <GroupCard 
                    key={group.id} 
                    group={group} 
                    isMember={true}
                    onLeave={() => onLeaveGroup(group.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Groups */}
          {otherGroups.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Descobrir Grupos
              </h2>
              <div className="space-y-3">
                {otherGroups.map((group) => (
                  <GroupCard 
                    key={group.id} 
                    group={group} 
                    isMember={false}
                    onJoin={() => onJoinGroup(group.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Invite Card */}
          <div className="mt-8 bg-primary/10 border border-primary/20 rounded-2xl p-6 text-center space-y-4">
            <Share2 className="w-10 h-10 text-primary mx-auto opacity-60" />
            <h3 className="text-lg font-black tracking-tighter">Recrute Atletas</h3>
            <p className="text-sm text-muted-foreground">
              Monte seu esquadrão e domine a cidade juntos.
            </p>
            <Button onClick={handleShare} variant="outline" className="w-full border-primary text-primary">
              Convidar via Link
            </Button>
          </div>
        </>
      )}

      {/* Athletes Tab */}
      {activeTab === 'athletes' && (
        <UserSearch 
          onSelectUser={handleSelectUser}
          excludeUserId={user?.id}
        />
      )}

      {/* Profile Modal */}
      <VisitableProfile
        isOpen={!!selectedProfile}
        onClose={() => setSelectedProfile(null)}
        profile={selectedProfile}
      />
    </div>
  );
}

interface GroupCardProps {
  group: Group;
  isMember: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
}

function GroupCard({ group, isMember, onJoin, onLeave }: GroupCardProps) {
  return (
    <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-4">
      <div className="w-14 h-14 bg-gradient-neon rounded-xl flex items-center justify-center font-black text-xl rotate-3">
        {group.name.slice(0, 2).toUpperCase()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold truncate">{group.name}</span>
          {isMember && <Crown className="w-4 h-4 text-primary" />}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {group.member_count || 0} membros
          </span>
          <span>{group.total_area.toLocaleString()} m²</span>
        </div>
      </div>

      {isMember ? (
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onLeave}
          className="text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      ) : (
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onJoin}
          className="text-primary hover:bg-primary/10"
        >
          <LogIn className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
