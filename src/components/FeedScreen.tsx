import { useState, useEffect } from 'react';
import { Trophy, MapPin, Clock, Image as ImageIcon, Users, Navigation } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PostInteractions } from './PostInteractions';
import { useFriendsFeed, useNearbyFeed, ConquestPost } from '@/hooks/useConquestPosts';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

interface FeedScreenProps {
  onViewProfile?: (profile: Profile) => void;
}

export function FeedScreen({ onViewProfile }: FeedScreenProps) {
  const [activeTab, setActiveTab] = useState<'friends' | 'nearby'>('friends');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => console.log('Location not available')
      );
    }
  }, []);

  const { data: friendsPosts = [], isLoading: loadingFriends } = useFriendsFeed();
  const { data: nearbyPosts = [], isLoading: loadingNearby } = useNearbyFeed(
    userLocation?.lat,
    userLocation?.lng,
    50
  );

  const posts = activeTab === 'friends' ? friendsPosts : nearbyPosts;
  const isLoading = activeTab === 'friends' ? loadingFriends : loadingNearby;

  return (
    <div className="p-4 pb-24 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black tracking-tighter uppercase italic text-primary">ZONNA</h1>
      </div>

      <div className="flex gap-2 mb-6 p-1 bg-card rounded-xl border border-border">
        <button
          onClick={() => setActiveTab('friends')}
          className={cn(
            'flex-1 py-2.5 px-4 rounded-lg font-bold text-sm uppercase transition-all flex items-center justify-center gap-2',
            activeTab === 'friends' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          )}
        >
          <Users className="w-4 h-4" /> Amigos
        </button>
        <button
          onClick={() => setActiveTab('nearby')}
          className={cn(
            'flex-1 py-2.5 px-4 rounded-lg font-bold text-sm uppercase transition-all flex items-center justify-center gap-2',
            activeTab === 'nearby' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          )}
        >
          <Navigation className="w-4 h-4" /> Próximos
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState tab={activeTab} hasLocation={!!userLocation} />
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <ConquestPostCard key={post.id} post={post} onViewProfile={onViewProfile} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConquestPostCard({ post, onViewProfile }: { post: ConquestPost; onViewProfile?: (profile: Profile) => void }) {
  const profile = post.profile;
  const conquest = post.conquest;

  // CORREÇÃO DOS CAMPOS: Usando 'name' em vez de 'username' e tratando duração
  const userName = profile?.name || 'Explorador';
  const distanceKm = conquest?.distance || 0;
  
  // Verifica se o campo é 'duration' ou 'duration_seconds' baseado no erro da imagem
  const durationSec = (conquest as any)?.duration_seconds || (conquest as any)?.duration || 0;

  const calculatePace = () => {
    if (!distanceKm || !durationSec) return "0:00";
    const paceMin = (durationSec / 60) / distanceKm;
    const mins = Math.floor(paceMin);
    const secs = Math.round((paceMin - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = () => {
    const h = Math.floor(durationSec / 3600);
    const m = Math.floor((durationSec % 3600) / 60);
    const s = Math.floor(durationSec % 60);
    return h > 0 
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
      <div className="p-4 flex items-center gap-3">
        <button 
          onClick={() => profile && onViewProfile?.(profile)}
          className="w-10 h-10 rounded-full bg-muted overflow-hidden border border-border"
        >
          <img 
            src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} 
            className="w-full h-full object-cover" 
          />
        </button>
        <div>
          <h4 
            className="font-bold text-sm hover:underline cursor-pointer" 
            onClick={() => profile && onViewProfile?.(profile)}
          >
            {userName}
          </h4>
          <p className="text-[10px] text-muted-foreground uppercase font-medium">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
          </p>
        </div>
      </div>

      <div className="px-4 pb-2">
        <h3 className="text-lg font-black italic uppercase tracking-tight">{post.title || 'Nova Conquista'}</h3>
      </div>

      <div className="relative aspect-video bg-muted border-y border-border">
        <img 
          src={post.photo_urls?.[0] || (conquest as any)?.map_preview_url || 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&w=1000'} 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-3 right-3 bg-primary/90 px-2 py-1 rounded text-[10px] font-black italic text-primary-foreground">
          {conquest?.area?.toLocaleString()} M²
        </div>
      </div>

      <div className="grid grid-cols-3 p-4 gap-2 border-b border-border/50">
        <div className="flex flex-col">
          <span className="text-[9px] text-muted-foreground font-bold uppercase">Distância</span>
          <span className="text-lg font-black italic">{distanceKm.toFixed(2)}<small className="text-[10px] ml-0.5">km</small></span>
        </div>
        <div className="flex flex-col border-x border-border/50 px-3">
          <span className="text-[9px] text-muted-foreground font-bold uppercase">Ritmo</span>
          <span className="text-lg font-black italic">{calculatePace()}<small className="text-[10px] ml-0.5">/km</small></span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-muted-foreground font-bold uppercase">Tempo</span>
          <span className="text-lg font-black italic">{formatDuration()}</span>
        </div>
      </div>

      <div className="px-2 py-1">
        <PostInteractions 
          postId={post.id}
          postOwnerId={post.user_id}
          locationName={post.title}
          onViewProfile={onViewProfile}
        />
      </div>
    </div>
  );
}

function EmptyState({ tab, hasLocation }: { tab: 'friends' | 'nearby'; hasLocation: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        {tab === 'friends' ? <Users className="w-8 h-8 text-muted-foreground" /> : <Navigation className="w-8 h-8 text-muted-foreground" />}
      </div>
      <h3 className="text-lg font-bold italic uppercase">Nada por aqui</h3>
      <p className="text-muted-foreground text-sm mt-2">
        {tab === 'friends' ? 'Siga amigos para ver suas atividades.' : 'Seja o primeiro a conquistar esta área!'}
      </p>
    </div>
  );
}