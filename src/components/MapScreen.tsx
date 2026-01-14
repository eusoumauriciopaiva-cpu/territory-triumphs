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

// Local storage key for cached position
const LAST_POSITION_KEY = 'zonna_last_position';

// Get cached position from localStorage
function getCachedPosition(): [number, number] | null {
  try {
    const cached = localStorage.getItem(LAST_POSITION_KEY);
    if (cached) {
      const { lat, lng, timestamp } = JSON.parse(cached);
      // Use cached position if less than 1 hour old
      if (Date.now() - timestamp < 3600000) {
        return [lat, lng];
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

// Save position to localStorage
function cachePosition(lat: number, lng: number) {
  try {
    localStorage.setItem(LAST_POSITION_KEY, JSON.stringify({
      lat,
      lng,
      timestamp: Date.now(),
    }));
  } catch {
    // Ignore storage errors
  }
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
  // Start with cached position for instant loading
  const [userPosition, setUserPosition] = useState<[number, number] | null>(getCachedPosition);
  const [userBearing, setUserBearing] = useState<number>(0);
  const [followUser, setFollowUser] = useState(true);
  const [mapStyle, setMapStyle] = useState<MapStyleType>('standard');
  const lastPositionRef = useRef<[number, number] | null>(null);

  // Watch user position continuously with maximum precision
  useEffect(() => {
    // First, try to get a quick low-accuracy position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPosition(newPos);
        cachePosition(newPos[0], newPos[1]);
        lastPositionRef.current = newPos;
      },
      () => {},
      { enableHighAccuracy: false, timeout: 2000, maximumAge: 60000 }
    );

    // Then watch with high accuracy
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
        cachePosition(newPos[0], newPos[1]);
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

      {/* Controls - High Contrast */}
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
          className="bg-black/90 hover:bg-black border border-white/20 rounded-full w-12 h-12 shadow-xl"
        >
          <Focus className="w-5 h-5 text-white" />
        </Button>

        {selectedConquest && (
          <Button
            variant="secondary"
            size="icon"
            onClick={() => onSelectConquest(null)}
            className="bg-black/90 hover:bg-black border border-white/20 rounded-full w-12 h-12 shadow-xl"
          >
            <Layers className="w-5 h-5 text-white" />
          </Button>
        )}
      </div>

      {/* Selected conquest info */}
      {selectedConquest && (
        <div className="absolute top-4 left-4 right-4 bg-black/90 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60 font-bold uppercase">Conquista Selecionada</p>
              <p className="text-lg font-black text-white">
                {selectedConquest.area.toLocaleString()} m²
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/60">
                {Number(selectedConquest.distance).toFixed(2)} km
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
