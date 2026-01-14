import { Trophy, MapPin, Clock, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RankBadge } from './RankBadge';
import { useConquestPosts, ConquestPost } from '@/hooks/useConquestPosts';
import { Skeleton } from './ui/skeleton';

export function FeedScreen() {
  const { data: posts = [], isLoading } = useConquestPosts();

  if (isLoading) {
    return (
      <div className="p-4 pb-24 space-y-4">
        <h1 className="text-2xl font-black tracking-tighter mb-6">Feed Global</h1>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black tracking-tighter">Feed Global</h1>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold mb-2">Nenhuma conquista ainda</h3>
          <p className="text-muted-foreground text-sm">
            Inicie uma corrida para conquistar territórios!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <ConquestPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConquestPostCard({ post }: { post: ConquestPost }) {
  const profile = post.profile;
  const conquest = post.conquest;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-neon flex items-center justify-center font-black text-lg overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            profile?.name?.charAt(0).toUpperCase() || '?'
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold">
              {profile?.nickname ? `@${profile.nickname}` : profile?.name || 'Atleta'}
            </span>
            {profile?.rank && <RankBadge rank={profile.rank} size="sm" showLabel={false} />}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>
              {formatDistanceToNow(new Date(post.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Title & Description */}
      {(post.title || post.description) && (
        <div className="px-4 pb-3">
          {post.title && (
            <h3 className="font-bold text-lg">{post.title}</h3>
          )}
          {post.description && (
            <p className="text-muted-foreground text-sm mt-1">{post.description}</p>
          )}
        </div>
      )}

      {/* Photos */}
      {post.photo_urls.length > 0 && (
        <div className="px-4 pb-3">
          <div className={`grid gap-2 ${post.photo_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {post.photo_urls.map((url, index) => (
              <div key={index} className="aspect-square rounded-xl overflow-hidden bg-muted">
                <img 
                  src={url} 
                  alt="" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map Preview - Static representation */}
      {conquest && (
        <div className="mx-4 mb-3 rounded-xl overflow-hidden border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <MapPin className="w-3 h-3" />
            <span>Território Conquistado</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Área</p>
                <p className="font-mono-display font-bold text-primary">
                  {conquest.area.toLocaleString()} m²
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Distância</p>
                <p className="font-mono-display font-bold">
                  {Number(conquest.distance).toFixed(2)} km
                </p>
              </div>
            </div>
            <Trophy className="w-8 h-8 text-primary/30" />
          </div>
        </div>
      )}

      {/* Stats Footer */}
      <div className="px-4 py-3 border-t border-border bg-muted/20">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Histórico permanente</span>
          {post.photo_urls.length > 0 && (
            <span className="flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              {post.photo_urls.length} foto{post.photo_urls.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
