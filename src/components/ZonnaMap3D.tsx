import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Conquest } from '@/types';
import { CARTO_DARK_STYLE, applyZonnaStyleOverrides } from '@/lib/mapStyle';

interface ZonnaMap3DProps {
  userPosition: [number, number] | null;
  followUser?: boolean;
  recordingPath?: [number, number][];
  conquests?: Conquest[];
  selectedConquest?: Conquest | null;
  onVictoryZoom?: boolean;
  heatmapMode?: boolean;
  userConquests?: Conquest[];
  trailColor?: string;
}

export function ZonnaMap3D({
  userPosition,
  followUser = false,
  recordingPath = [],
  conquests = [],
  selectedConquest,
  onVictoryZoom = false,
  heatmapMode = false,
  userConquests = [],
  trailColor = '#FF4F00',
}: ZonnaMap3DProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<HTMLDivElement | null>(null);
  const markerObjRef = useRef<maplibregl.Marker | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initialCenter = userPosition || [-46.6333, -23.5505];

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: CARTO_DARK_STYLE,
      center: [initialCenter[1], initialCenter[0]],
      zoom: 16,
      pitch: 60,
      bearing: 0,
      antialias: true,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Apply ZONNA High-Contrast Dark style overrides (Strava-inspired)
      applyZonnaStyleOverrides(map.current);

      // Add 3D buildings layer
      const layers = map.current.getStyle().layers;
      const labelLayerId = layers?.find(
        (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
      )?.id;

      map.current.addLayer(
        {
          id: '3d-buildings',
          source: 'carto',
          'source-layer': 'building',
          type: 'fill-extrusion',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': '#252525',
            'fill-extrusion-height': ['get', 'render_height'],
            'fill-extrusion-base': ['get', 'render_min_height'],
            'fill-extrusion-opacity': 0.8,
          },
        },
        labelLayerId
      );

      // Add neon trail source
      map.current.addSource('recording-path', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Glow layer (wider, more transparent)
      map.current.addLayer({
        id: 'recording-path-glow',
        type: 'line',
        source: 'recording-path',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#FF4500',
          'line-width': 12,
          'line-opacity': 0.3,
          'line-blur': 8,
        },
      });

      // Main neon line
      map.current.addLayer({
        id: 'recording-path-line',
        type: 'line',
        source: 'recording-path',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#FF4500',
          'line-width': 4,
          'line-opacity': 1,
        },
      });

      // Core bright line
      map.current.addLayer({
        id: 'recording-path-core',
        type: 'line',
        source: 'recording-path',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 1.5,
          'line-opacity': 0.8,
        },
      });

      // Add conquests source
      map.current.addSource('conquests', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Conquest fill
      map.current.addLayer({
        id: 'conquests-fill',
        type: 'fill',
        source: 'conquests',
        paint: {
          'fill-color': '#FF4500',
          'fill-opacity': 0.2,
        },
      });

      // Conquest outline
      map.current.addLayer({
        id: 'conquests-outline',
        type: 'line',
        source: 'conquests',
        paint: {
          'line-color': '#FF4500',
          'line-width': 2,
          'line-opacity': 0.8,
        },
      });

      // Heatmap source for profile view
      map.current.addSource('heatmap', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.current.addLayer({
        id: 'heatmap-fill',
        type: 'fill',
        source: 'heatmap',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, 'rgba(255, 69, 0, 0.1)',
            0.5, 'rgba(255, 69, 0, 0.4)',
            1, 'rgba(255, 69, 0, 0.7)',
          ],
          'fill-opacity': 0.8,
        },
      });

      setLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update user marker with pulse effect
  useEffect(() => {
    if (!map.current || !loaded || !userPosition) return;

    if (markerObjRef.current) {
      markerObjRef.current.setLngLat([userPosition[1], userPosition[0]]);
    } else {
      // Create custom marker element with pulse
      const el = document.createElement('div');
      el.className = 'zonna-position-marker';
      el.innerHTML = `
        <div class="zonna-pulse-ring"></div>
        <div class="zonna-pulse-ring zonna-pulse-ring-2"></div>
        <div class="zonna-marker-core"></div>
      `;
      
      markerRef.current = el;
      markerObjRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([userPosition[1], userPosition[0]])
        .addTo(map.current);
    }

    if (followUser) {
      map.current.easeTo({
        center: [userPosition[1], userPosition[0]],
        duration: 500,
      });
    }
  }, [userPosition, followUser, loaded]);

  // Update recording path
  useEffect(() => {
    if (!map.current || !loaded) return;

    const source = map.current.getSource('recording-path') as maplibregl.GeoJSONSource;
    if (!source) return;

    if (recordingPath.length > 1) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: recordingPath.map(([lat, lng]) => [lng, lat]),
        },
      });
    } else {
      source.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [recordingPath, loaded]);

  // Update trail color dynamically
  useEffect(() => {
    if (!map.current || !loaded) return;

    // Update glow layer color
    if (map.current.getLayer('recording-path-glow')) {
      map.current.setPaintProperty('recording-path-glow', 'line-color', trailColor);
    }
    
    // Update main line color
    if (map.current.getLayer('recording-path-line')) {
      map.current.setPaintProperty('recording-path-line', 'line-color', trailColor);
    }

    // Update conquest fill and outline colors
    if (map.current.getLayer('conquests-fill')) {
      map.current.setPaintProperty('conquests-fill', 'fill-color', trailColor);
    }
    if (map.current.getLayer('conquests-outline')) {
      map.current.setPaintProperty('conquests-outline', 'line-color', trailColor);
    }
  }, [trailColor, loaded]);

  // Update conquests
  useEffect(() => {
    if (!map.current || !loaded) return;

    const source = map.current.getSource('conquests') as maplibregl.GeoJSONSource;
    if (!source) return;

    const features = conquests.map((conquest) => ({
      type: 'Feature' as const,
      properties: {
        id: conquest.id,
        area: conquest.area,
        selected: conquest.id === selectedConquest?.id,
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [conquest.path.map(([lat, lng]) => [lng, lat])],
      },
    }));

    source.setData({ type: 'FeatureCollection', features });
  }, [conquests, selectedConquest, loaded]);

  // Update heatmap
  useEffect(() => {
    if (!map.current || !loaded || !heatmapMode) return;

    const source = map.current.getSource('heatmap') as maplibregl.GeoJSONSource;
    if (!source) return;

    const features = userConquests.map((conquest, index) => ({
      type: 'Feature' as const,
      properties: {
        intensity: Math.min(1, 0.3 + (index * 0.1)),
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [conquest.path.map(([lat, lng]) => [lng, lat])],
      },
    }));

    source.setData({ type: 'FeatureCollection', features });
  }, [userConquests, heatmapMode, loaded]);

  // Victory zoom out effect
  useEffect(() => {
    if (!map.current || !loaded || !onVictoryZoom) return;

    map.current.easeTo({
      zoom: 14,
      pitch: 45,
      duration: 1500,
      easing: (t) => 1 - Math.pow(1 - t, 3),
    });
  }, [onVictoryZoom, loaded]);

  // Focus on selected conquest
  useEffect(() => {
    if (!map.current || !loaded || !selectedConquest) return;

    const bounds = new maplibregl.LngLatBounds();
    selectedConquest.path.forEach(([lat, lng]) => {
      bounds.extend([lng, lat]);
    });

    map.current.fitBounds(bounds, {
      padding: 80,
      duration: 800,
    });
  }, [selectedConquest, loaded]);

  return (
    <div ref={mapContainer} className="w-full h-full" />
  );
}
