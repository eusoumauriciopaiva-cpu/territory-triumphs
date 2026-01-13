import { useState } from 'react';
import { ZonnaMap3D } from './ZonnaMap3D';
import { MapStyleToggle } from './MapStyleToggle';
import { Button } from './ui/button';
import { Layers, Focus } from 'lucide-react';
import type { Conquest } from '@/types';
import type { MapStyleType } from '@/lib/mapStyle';

interface MapScreenProps {
  conquests: Conquest[];
  selectedConquest: Conquest | null;
  onSelectConquest: (conquest: Conquest | null) => void;
}

export function MapScreen({ conquests, selectedConquest, onSelectConquest }: MapScreenProps) {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [followUser, setFollowUser] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyleType>('dark');

  const handleLocate = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        setFollowUser(true);
        setTimeout(() => setFollowUser(false), 2000);
      },
      () => {},
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="h-full w-full relative">
      <ZonnaMap3D 
        conquests={conquests}
        selectedConquest={selectedConquest}
        userPosition={userPosition}
        followUser={followUser}
        mapStyle={mapStyle}
      />

      {/* Controls */}
      <div className="absolute bottom-24 right-4 flex flex-col gap-2">
        {/* Map Style Toggle */}
        <MapStyleToggle
          currentStyle={mapStyle}
          onStyleChange={setMapStyle}
        />

        <Button
          variant="secondary"
          size="icon"
          onClick={handleLocate}
          className="glass border border-border rounded-full w-12 h-12"
        >
          <Focus className="w-5 h-5" />
        </Button>

        {selectedConquest && (
          <Button
            variant="secondary"
            size="icon"
            onClick={() => onSelectConquest(null)}
            className="glass border border-border rounded-full w-12 h-12"
          >
            <Layers className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Selected conquest info */}
      {selectedConquest && (
        <div className="absolute top-4 left-4 right-4 glass rounded-2xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase">Conquista Selecionada</p>
              <p className="text-lg font-black">
                {selectedConquest.area.toLocaleString()} m²
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {Number(selectedConquest.distance).toFixed(2)} km
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
