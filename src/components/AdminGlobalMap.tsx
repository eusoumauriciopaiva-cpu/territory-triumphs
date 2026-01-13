import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  getMapStyleUrl, 
  applyStandardStyleOverrides, 
  needsStandardOverrides,
  type MapStyleType 
} from '@/lib/mapStyle';

interface AdminConquest {
  id: string;
  user_id: string;
  path: [number, number][];
  area: number;
  distance: number;
  created_at: string;
  profile_name: string;
  profile_nickname: string | null;
  trail_color: string;
}

interface AdminGlobalMapProps {
  conquests: AdminConquest[];
  filterUserIds?: string[];
  mapStyle?: MapStyleType;
}

export function AdminGlobalMap({ 
  conquests, 
  filterUserIds,
  mapStyle = 'standard' 
}: AdminGlobalMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Start with world view centered on Brazil
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: getMapStyleUrl(mapStyle),
      center: [-46.6333, -23.5505],
      zoom: 3,
      pitch: 45,
      bearing: 0,
      antialias: true,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Apply Standard style overrides for light mode
      if (needsStandardOverrides(mapStyle)) {
        applyStandardStyleOverrides(map.current);
      }

      // Add global heatmap source
      map.current.addSource('global-conquests', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Heatmap layer for global view
      map.current.addLayer({
        id: 'conquests-heat',
        type: 'heatmap',
        source: 'global-conquests',
        maxzoom: 12,
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'area'],
            0, 0,
            10000, 1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            12, 3
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.2, 'rgba(255, 69, 0, 0.3)',
            0.4, 'rgba(255, 100, 0, 0.5)',
            0.6, 'rgba(255, 140, 0, 0.7)',
            0.8, 'rgba(255, 180, 0, 0.85)',
            1, 'rgba(255, 220, 100, 1)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 5,
            12, 40
          ],
          'heatmap-opacity': 0.8
        }
      });

      // Detailed polygons for zoomed view
      map.current.addLayer({
        id: 'conquests-fill',
        type: 'fill',
        source: 'global-conquests',
        minzoom: 10,
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 0,
            14, 0.4
          ]
        }
      });

      // Conquest outlines
      map.current.addLayer({
        id: 'conquests-outline',
        type: 'line',
        source: 'global-conquests',
        minzoom: 10,
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 0,
            14, 0.8
          ]
        }
      });

      // Add popup on click
      map.current.on('click', 'conquests-fill', (e) => {
        if (!e.features?.length) return;
        
        const feature = e.features[0];
        const props = feature.properties;
        
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-2 bg-black text-white font-mono text-xs">
              <p class="text-primary font-bold">${props?.name || 'Anônimo'}</p>
              ${props?.nickname ? `<p class="text-muted-foreground">@${props.nickname}</p>` : ''}
              <p class="mt-1">${Number(props?.area || 0).toLocaleString()} m²</p>
              <p>${Number(props?.distance || 0).toFixed(2)} km</p>
            </div>
          `)
          .addTo(map.current!);
      });

      map.current.on('mouseenter', 'conquests-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'conquests-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });

      setLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapStyle]);

  // Update conquests data
  useEffect(() => {
    if (!map.current || !loaded) return;

    const source = map.current.getSource('global-conquests') as maplibregl.GeoJSONSource;
    if (!source) return;

    // Filter conquests if filterUserIds is provided
    const filteredConquests = filterUserIds?.length 
      ? conquests.filter(c => filterUserIds.includes(c.user_id))
      : conquests;

    const features = filteredConquests.map((conquest) => ({
      type: 'Feature' as const,
      properties: {
        id: conquest.id,
        area: conquest.area,
        distance: conquest.distance,
        name: conquest.profile_name,
        nickname: conquest.profile_nickname,
        color: conquest.trail_color || '#FF4F00',
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [conquest.path.map(([lat, lng]) => [lng, lat])],
      },
    }));

    source.setData({ type: 'FeatureCollection', features });

    // If we have conquests, fit bounds to show all
    if (features.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      filteredConquests.forEach(c => {
        c.path.forEach(([lat, lng]) => bounds.extend([lng, lat]));
      });
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12,
        duration: 1000
      });
    }
  }, [conquests, filterUserIds, loaded]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden relative bg-[#1a1a1b]">
      <div ref={mapContainer} className="w-full h-full" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1b]">
          <div className="text-center">
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-primary font-mono text-xs tracking-wider animate-pulse">
              CARREGANDO MAPA
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
