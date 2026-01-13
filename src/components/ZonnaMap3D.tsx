import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Conquest } from '@/types';
import { 
  getMapStyleUrl, 
  applyZonnaStyleOverrides, 
  needsZonnaOverrides,
  type MapStyleType 
} from '@/lib/mapStyle';

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
  mapStyle?: MapStyleType;
}

// Helper function to setup map layers
function setupMapLayers(mapInstance: maplibregl.Map, trailColor: string, styleType: MapStyleType) {
  // Add 3D buildings layer (only works with vector tile sources)
  try {
    const layers = mapInstance.getStyle().layers;
    const labelLayerId = layers?.find(
      (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
    )?.id;

    // Check if source exists before adding layer
    if (mapInstance.getSource('carto')) {
      mapInstance.addLayer(
        {
          id: '3d-buildings',
          source: 'carto',
          'source-layer': 'building',
          type: 'fill-extrusion',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': styleType === 'satellite' ? '#333333' : '#252525',
            'fill-extrusion-height': ['get', 'render_height'],
            'fill-extrusion-base': ['get', 'render_min_height'],
            'fill-extrusion-opacity': 0.8,
          },
        },
        labelLayerId
      );
    }
  } catch (e) {
    console.log('3D buildings not available for this map style');
  }

  // Add neon trail source
  mapInstance.addSource('recording-path', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  // Glow layer (wider, more transparent)
  mapInstance.addLayer({
    id: 'recording-path-glow',
    type: 'line',
    source: 'recording-path',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': trailColor,
      'line-width': 12,
      'line-opacity': 0.4,
      'line-blur': 8,
    },
  });

  // Main neon line
  mapInstance.addLayer({
    id: 'recording-path-line',
    type: 'line',
    source: 'recording-path',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': trailColor,
      'line-width': 4,
      'line-opacity': 1,
    },
  });

  // Core bright line
  mapInstance.addLayer({
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
  mapInstance.addSource('conquests', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  // Conquest fill
  mapInstance.addLayer({
    id: 'conquests-fill',
    type: 'fill',
    source: 'conquests',
    paint: {
      'fill-color': trailColor,
      'fill-opacity': 0.2,
    },
  });

  // Conquest outline
  mapInstance.addLayer({
    id: 'conquests-outline',
    type: 'line',
    source: 'conquests',
    paint: {
      'line-color': trailColor,
      'line-width': 2,
      'line-opacity': 0.8,
    },
  });

  // Heatmap source for profile view
  mapInstance.addSource('heatmap', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  mapInstance.addLayer({
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
  mapStyle = 'dark',
}: ZonnaMap3DProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<HTMLDivElement | null>(null);
  const markerObjRef = useRef<maplibregl.Marker | null>(null);
  const [loaded, setLoaded] = useState(false);
  const currentStyleRef = useRef<MapStyleType>(mapStyle);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initialCenter = userPosition || [-46.6333, -23.5505];

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: getMapStyleUrl(mapStyle),
      center: [initialCenter[1], initialCenter[0]],
      zoom: 16,
      pitch: 60,
      bearing: 0,
      antialias: true,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Apply ZONNA High-Contrast Dark style overrides (Strava-inspired) - only for dark mode
      if (needsZonnaOverrides(mapStyle)) {
        applyZonnaStyleOverrides(map.current);
      }

      // Setup all map layers using helper function
      setupMapLayers(map.current, trailColor, mapStyle);

      setLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapStyle]);

  // Handle style changes dynamically
  useEffect(() => {
    if (!map.current || !loaded) return;
    
    // Only update if style actually changed
    if (currentStyleRef.current === mapStyle) return;
    currentStyleRef.current = mapStyle;

    const currentCenter = map.current.getCenter();
    const currentZoom = map.current.getZoom();
    const currentPitch = map.current.getPitch();
    const currentBearing = map.current.getBearing();

    // Store current path data
    const pathSource = map.current.getSource('recording-path') as maplibregl.GeoJSONSource;
    let pathData: GeoJSON.GeoJSON | null = null;
    if (pathSource && recordingPath.length > 1) {
      pathData = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: recordingPath.map(([lat, lng]) => [lng, lat]),
        },
      } as GeoJSON.Feature;
    }

    // Set new style
    map.current.setStyle(getMapStyleUrl(mapStyle));

    map.current.once('style.load', () => {
      if (!map.current) return;

      // Restore camera position
      map.current.setCenter(currentCenter);
      map.current.setZoom(currentZoom);
      map.current.setPitch(currentPitch);
      map.current.setBearing(currentBearing);

      // Apply overrides for dark mode
      if (needsZonnaOverrides(mapStyle)) {
        applyZonnaStyleOverrides(map.current);
      }

      // Re-add sources and layers
      setupMapLayers(map.current, trailColor, mapStyle);

      // Restore path data
      if (pathData) {
        const source = map.current.getSource('recording-path') as maplibregl.GeoJSONSource;
        if (source) source.setData(pathData);
      }
    });
  }, [mapStyle, loaded, recordingPath, trailColor]);

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
