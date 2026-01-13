import { useState, useEffect, useRef } from 'react';
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

// Calculate bearing between two points (in degrees)
function calculateBearing(from: [number, number], to: [number, number]): number {
  const lat1 = from[0] * Math.PI / 180;
  const lat2 = to[0] * Math.PI / 180;
  const dLon = (to[1] - from[1]) * Math.PI / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
}

// Calculate distance between two points (in meters)
function calculateDistance(from: [number, number], to: [number, number]): number {
  const R = 6371000; // Earth radius in meters
  const lat1 = from[0] * Math.PI / 180;
  const lat2 = to[0] * Math.PI / 180;
  const dLat = (to[0] - from[0]) * Math.PI / 180;
  const dLon = (to[1] - from[1]) * Math.PI / 180;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function MapScreen({ conquests, selectedConquest, onSelectConquest }: MapScreenProps) {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [userBearing, setUserBearing] = useState<number>(0);
  const [followUser, setFollowUser] = useState(true);
  const [mapStyle, setMapStyle] = useState<MapStyleType>('standard');
  const lastPositionRef = useRef<[number, number] | null>(null);

  // Watch user position continuously with maximum precision
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        
        // Calculate bearing from movement if we have a previous position
        if (lastPositionRef.current) {
          const distance = calculateDistance(lastPositionRef.current, newPos);
          
          // Only update bearing if moved more than 3 meters (reduces jitter)
          if (distance > 3) {
            const newBearing = calculateBearing(lastPositionRef.current, newPos);
            setUserBearing(newBearing);
            lastPositionRef.current = newPos;
          }
        } else {
          lastPositionRef.current = newPos;
        }

        // Use device heading if available (compass)
        if (pos.coords.heading !== null && !isNaN(pos.coords.heading)) {
          setUserBearing(pos.coords.heading);
        }

        setUserPosition(newPos);
      },
      () => {},
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const handleLocate = () => {
    setFollowUser(true);
  };

  return (
    <div className="h-full w-full relative">
      <ZonnaMap3D 
        conquests={conquests}
        selectedConquest={selectedConquest}
        userPosition={userPosition}
        userBearing={userBearing}
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
