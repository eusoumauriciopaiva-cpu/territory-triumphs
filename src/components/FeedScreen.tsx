import { useState, useEffect } from 'react';
import { Trophy, MapPin, Clock, Image as ImageIcon, Users, Navigation } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RankBadge } from './RankBadge';
import { useConquestPosts, useFriendsFeed, useNearbyFeed, ConquestPost } from '@/hooks/useConquestPosts';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

interface FeedScreenProps {
  onViewProfile?: (profile: Profile) => void;
}

export function FeedScreen({ onViewProfile }: FeedScreenProps) {
  const [activeTab, setActiveTab] = useState<'friends' | 'nearby'>('friends');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user location for nearby feed
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Fallback - still allow friends tab
          console.log('Location not available');
        }
      );
    }
  }, []);

  const { data: friendsPosts = [], isLoading: loadingFriends } = useFriendsFeed();
  const { data: nearbyPosts = [], isLoading: loadingNearby } = useNearbyFeed(
    userLocation?.lat,
    userLocation?.lng,
    50 // 50km radius
  );

  const posts = activeTab === 'friends' ? friendsPosts : nearbyPosts;
  const isLoading = activeTab === 'friends' ? loadingFriends : loadingNearby;

  return (
    <div className="p-4 pb-24 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black tracking-tighter">Feed</h1>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6 p-1 bg-card rounded-xl border border-border">
        <button
          onClick={() => setActiveTab('friends')}
          className={cn(
            'flex-1 py-2.5 px-4 rounded-lg font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2',
            activeTab === 'friends'
              ? 'bg-primary text-black'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Users className="w-4 h-4" />
          Amigos
        </button>
        <button
          onClick={() => setActiveTab('nearby')}
          className={cn(
            'flex-1 py-2.5 px-4 rounded-lg font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2',
            activeTab === 'nearby'
              ? 'bg-primary text-black'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Navigation className="w-4 h-4" />
          Próximos
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState tab={activeTab} hasLocation={!!userLocation} />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <ConquestPostCard key={post.id} post={post} onViewProfile={onViewProfile} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ tab, hasLocation }: { tab: 'friends' | 'nearby'; hasLocation: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4">
        {tab === 'friends' ? (
          <Users className="w-8 h-8 text-muted-foreground" />
        ) : (
          <Navigation className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      <h3 className="text-lg font-bold mb-2">
        {tab === 'friends' ? 'Seu feed está vazio' : 'Nenhuma conquista próxima'}
      </h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        {tab === 'friends'
          ? 'Siga outros atletas para ver suas conquistas aqui!'
          : hasLocation
          ? 'Nenhum atleta conquistou território perto de você ainda.'
          : 'Permita a localização para ver conquistas próximas.'}
      </p>
    </div>
  );
}

interface ConquestPostCardProps {
  post: ConquestPost;
  onViewProfile?: (profile: Profile) => void;
}

function ConquestPostCard({ post, onViewProfile }: ConquestPostCardProps) {
  const profile = post.profile;
  const conquest = post.conquest;

  const handleProfileClick = () => {
    if (profile && onViewProfile) {
      onViewProfile(profile);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <button
          onClick={handleProfileClick}
          className="w-12 h-12 rounded-xl bg-gradient-neon flex items-center justify-center font-black text-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            profile?.name?.charAt(0).toUpperCase() || '?'
          )}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleProfileClick}
              className="font-bold hover:text-primary transition-colors"
            >
              {profile?.nickname ? `@${profile.nickname}` : profile?.name || 'Atleta'}
            </button>
            {profile?.rank && <RankBadge rank={profile.rank} size="sm" showLabel={false} />}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Title & Description */}
      {(post.title || post.description) && (
        <div className="px-4 pb-3">
          {post.title && <h3 className="font-bold text-lg">{post.title}</h3>}
          {post.description && (
            <p className="text-muted-foreground text-sm mt-1">{post.description}</p>
          )}
        </div>
      )}

      {/* Photos */}
      {post.photo_urls.length > 0 && (
        <div className="px-4 pb-3">
          <div
            className={`grid gap-2 ${post.photo_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
          >
            {post.photo_urls.map((url, index) => (
              <div key={index} className="aspect-square rounded-xl overflow-hidden bg-muted">
                <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map Preview */}
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