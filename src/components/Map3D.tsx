import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Conquest } from '@/types';

interface Map3DProps {
  conquests?: Conquest[];
  selectedConquest?: Conquest | null;
  currentPath?: [number, number][];
  userPosition?: [number, number] | null;
  followUser?: boolean;
  onMapReady?: (map: maplibregl.Map) => void;
}

export function Map3D({ 
  conquests = [], 
  selectedConquest, 
  currentPath = [],
  userPosition,
  followUser = false,
  onMapReady 
}: Map3DProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const userMarker = useRef<maplibregl.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initialCenter = userPosition || [-46.6333, -23.5505]; // São Paulo default

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            ],
            tileSize: 256,
            attribution: '© CARTO',
          },
        },
        layers: [
          {
            id: 'carto-layer',
            type: 'raster',
            source: 'carto',
            minzoom: 0,
            maxzoom: 20,
          },
        ],
      },
      center: [initialCenter[1], initialCenter[0]] as [number, number],
      zoom: 15,
      pitch: 60,
      bearing: -20,
      antialias: true,
    });

    map.current.on('load', () => {
      setIsLoaded(true);
      
      // Add 3D buildings layer
      map.current!.addSource('openmaptiles', {
        type: 'vector',
        url: 'https://api.maptiler.com/tiles/v3/tiles.json?key=get_your_own_key',
      });

      onMapReady?.(map.current!);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update user marker
  useEffect(() => {
    if (!map.current || !isLoaded || !userPosition) return;

    if (!userMarker.current) {
      const el = document.createElement('div');
      el.className = 'user-marker';
      el.innerHTML = `
        <div class="relative">
          <div class="absolute inset-0 bg-primary rounded-full animate-ping opacity-40"></div>
          <div class="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg relative z-10"></div>
        </div>
      `;
      
      userMarker.current = new maplibregl.Marker({ element: el })
        .setLngLat([userPosition[1], userPosition[0]])
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat([userPosition[1], userPosition[0]]);
    }

    if (followUser) {
      map.current.easeTo({
        center: [userPosition[1], userPosition[0]],
        duration: 500,
      });
    }
  }, [userPosition, followUser, isLoaded]);

  // Draw conquests polygons
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Remove existing conquest layers and sources
    conquests.forEach((_, index) => {
      const layerId = `conquest-fill-${index}`;
      const lineId = `conquest-line-${index}`;
      const sourceId = `conquest-${index}`;
      
      if (map.current!.getLayer(layerId)) map.current!.removeLayer(layerId);
      if (map.current!.getLayer(lineId)) map.current!.removeLayer(lineId);
      if (map.current!.getSource(sourceId)) map.current!.removeSource(sourceId);
    });

    // Add conquest polygons
    conquests.forEach((conquest, index) => {
      const sourceId = `conquest-${index}`;
      const isSelected = selectedConquest?.id === conquest.id;
      
      const coordinates = conquest.path.map(p => [p[1], p[0]]);
      if (coordinates.length > 2) {
        coordinates.push(coordinates[0]); // Close polygon
      }

      map.current!.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates],
          },
          properties: {},
        },
      });

      map.current!.addLayer({
        id: `conquest-fill-${index}`,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': isSelected ? '#FFFFFF' : '#FC4C02',
          'fill-opacity': isSelected ? 0.5 : 0.3,
        },
      });

      map.current!.addLayer({
        id: `conquest-line-${index}`,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': isSelected ? '#FFFFFF' : '#FC4C02',
          'line-width': isSelected ? 3 : 2,
          'line-opacity': 0.9,
        },
      });
    });

    // Fly to selected conquest
    if (selectedConquest && selectedConquest.path.length > 0) {
      map.current.flyTo({
        center: [selectedConquest.path[0][1], selectedConquest.path[0][0]],
        zoom: 16,
        pitch: 60,
        duration: 1500,
      });
    }
  }, [conquests, selectedConquest, isLoaded]);

  // Draw current recording path
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    const sourceId = 'current-path';
    const layerId = 'current-path-line';
    const glowLayerId = 'current-path-glow';

    // Remove existing path layer
    if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
    if (map.current.getLayer(glowLayerId)) map.current.removeLayer(glowLayerId);
    if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

    if (currentPath.length < 2) return;

    const coordinates = currentPath.map(p => [p[1], p[0]]);

    map.current.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates,
        },
        properties: {},
      },
    });

    // Glow effect
    map.current.addLayer({
      id: glowLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#FC4C02',
        'line-width': 12,
        'line-opacity': 0.3,
        'line-blur': 8,
      },
    });

    // Main line
    map.current.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#FC4C02',
        'line-width': 4,
        'line-opacity': 1,
      },
    });
  }, [currentPath, isLoaded]);

  return (
    <div ref={mapContainer} className="w-full h-full bg-background" />
  );
}
