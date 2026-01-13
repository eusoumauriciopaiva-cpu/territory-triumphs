import { Trophy, MapPin, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Conquest } from '@/types';
import { RankBadge } from './RankBadge';

interface FeedScreenProps {
  conquests: Conquest[];
}

export function FeedScreen({ conquests }: FeedScreenProps) {
  return (
    <div className="p-4 pb-24 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black tracking-tighter">Feed de Atividades</h1>
      </div>

      {conquests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold mb-2">Nenhuma atividade ainda</h3>
          <p className="text-muted-foreground text-sm">
            Inicie uma corrida para conquistar territórios!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {conquests.map((conquest) => (
            <ConquestCard key={conquest.id} conquest={conquest} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConquestCard({ conquest }: { conquest: Conquest }) {
  const profile = conquest.profile;

  return (
    <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-neon flex items-center justify-center font-black text-lg">
          {profile?.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold">{profile?.name || 'Atleta'}</span>
            {profile?.rank && <RankBadge rank={profile.rank} size="sm" showLabel={false} />}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>
              {formatDistanceToNow(new Date(conquest.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 py-3 border-t border-border">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Distância</p>
          <p className="text-xl font-black">
            {Number(conquest.distance).toFixed(2)}
            <span className="text-sm ml-1 text-primary">KM</span>
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Área</p>
          <p className="text-xl font-black">
            {conquest.area.toLocaleString()}
            <span className="text-sm ml-1 text-primary">m²</span>
          </p>
        </div>
      </div>
    </div>
  );
}
