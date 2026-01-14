import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Conquest } from '@/types';
import { 
  getMapStyleUrl, 
  applyStandardStyleOverrides, 
  needsStandardOverrides,
  type MapStyleType 
} from '@/lib/mapStyle';

interface ZonnaMap3DProps {
  userPosition: [number, number] | null;
  userBearing?: number;
  followUser?: boolean;
  recordingPath?: [number, number][];
  startPosition?: [number, number] | null;
  conquests?: Conquest[];
  selectedConquest?: Conquest | null;
  onVictoryZoom?: boolean;
  heatmapMode?: boolean;
  userConquests?: Conquest[];
  trailColor?: string;
  mapStyle?: MapStyleType;
}

// Guide line color for return to start
const GUIDE_LINE_COLOR = '#c6844d';

// Helper function to setup map layers (2D flat view - no 3D buildings)
function setupMapLayers(mapInstance: maplibregl.Map, trailColor: string) {
  // Add neon trail source (flat on map)
  mapInstance.addSource('recording-path', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  // Guide line source (start to current position)
  mapInstance.addSource('guide-line', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  // Guide line layer - dashed line from start to current
  mapInstance.addLayer({
    id: 'guide-line-dashed',
    type: 'line',
    source: 'guide-line',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': GUIDE_LINE_COLOR,
      'line-width': 3,
      'line-opacity': 0.8,
      'line-dasharray': [4, 4],
    },
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
      'fill-color': ['get', 'color'],
      'fill-opacity': 0.25,
    },
  });

  // Conquest outline
  mapInstance.addLayer({
    id: 'conquests-outline',
    type: 'line',
    source: 'conquests',
    paint: {
      'line-color': ['get', 'color'],
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
  userBearing = 0,
  followUser = false,
  recordingPath = [],
  startPosition = null,
  conquests = [],
  selectedConquest,
  onVictoryZoom = false,
  heatmapMode = false,
  userConquests = [],
  trailColor = '#FF4F00',
  mapStyle = 'standard',
}: ZonnaMap3DProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<HTMLDivElement | null>(null);
  const markerObjRef = useRef<maplibregl.Marker | null>(null);
  const startMarkerRef = useRef<maplibregl.Marker | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [loaded, setLoaded] = useState(false);
  const currentStyleRef = useRef<MapStyleType>(mapStyle);

  // Initialize map in 2D mode (flat, no tilt)
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initialCenter = userPosition || [-46.6333, -23.5505];

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: getMapStyleUrl(mapStyle),
      center: [initialCenter[1], initialCenter[0]],
      zoom: 16,
      pitch: 0, // Flat 2D view - no tilt
      bearing: 0,
      antialias: true,
      maxPitch: 0, // Lock pitch to prevent tilting
      pitchWithRotate: false, // Disable pitch with rotate gesture
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Apply Standard style overrides (Google Maps-like)
      if (needsStandardOverrides(mapStyle)) {
        applyStandardStyleOverrides(map.current);
      }

      // Disable touch pitch gesture
      map.current.touchPitch.disable();

      // Setup all map layers using helper function (2D flat)
      setupMapLayers(map.current, trailColor);

      // Add click handler for conquests
      map.current.on('click', 'conquests-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const feature = e.features[0];
        const nickname = feature.properties?.nickname || 'Desconhecido';
        const area = feature.properties?.area || 0;
        
        // Remove existing popup
        if (popupRef.current) {
          popupRef.current.remove();
        }
        
        // Create popup with clean design
        popupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: true,
          className: 'zonna-conquest-popup',
          offset: 10,
        })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="
              background: rgba(18, 18, 18, 0.95);
              padding: 8px 12px;
              border-radius: 8px;
              border: 1px solid rgba(255, 79, 0, 0.3);
              backdrop-filter: blur(8px);
            ">
              <p style="
                margin: 0;
                font-size: 12px;
                font-weight: 600;
                color: #fff;
              ">
                Dominado por <span style="color: #FF4F00;">@${nickname}</span>
              </p>
              <p style="
                margin: 2px 0 0;
                font-size: 10px;
                color: rgba(255,255,255,0.6);
              ">${area.toLocaleString()} m²</p>
            </div>
          `)
          .addTo(map.current!);
      });

      // Cursor style for interactive conquests
      map.current.on('mouseenter', 'conquests-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'conquests-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });

      setLoaded(true);
    });

    return () => {
      if (popupRef.current) popupRef.current.remove();
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

      // Restore camera position (keep 2D flat)
      map.current.setCenter(currentCenter);
      map.current.setZoom(currentZoom);
      map.current.setPitch(0); // Always flat
      map.current.setBearing(currentBearing);

      // Apply overrides for standard mode
      if (needsStandardOverrides(mapStyle)) {
        applyStandardStyleOverrides(map.current);
      }

      // Disable touch pitch
      map.current.touchPitch.disable();

      // Re-add sources and layers (2D flat)
      setupMapLayers(map.current, trailColor);

      // Restore path data
      if (pathData) {
        const source = map.current.getSource('recording-path') as maplibregl.GeoJSONSource;
        if (source) source.setData(pathData);
      }
    });
  }, [mapStyle, loaded, recordingPath, trailColor]);

  // Update user marker with pulse effect - persists across style changes
  useEffect(() => {
    if (!map.current || !loaded || !userPosition) return;

    // Remove existing marker if it exists (ensures it's re-added after style change)
    if (markerObjRef.current) {
      try {
        markerObjRef.current.remove();
      } catch (e) {
        // Marker may already be removed
      }
      markerObjRef.current = null;
    }

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
  }, [userPosition, loaded, mapStyle]);

  // Update start position marker and guide line
  useEffect(() => {
    if (!map.current || !loaded) return;

    // Remove existing start marker
    if (startMarkerRef.current) {
      try {
        startMarkerRef.current.remove();
      } catch (e) {}
      startMarkerRef.current = null;
    }

    // Update guide line (from start to current position)
    const guideSource = map.current.getSource('guide-line') as maplibregl.GeoJSONSource;
    if (guideSource) {
      if (startPosition && userPosition) {
        // Draw guide line
        guideSource.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [startPosition[1], startPosition[0]],
              [userPosition[1], userPosition[0]],
            ],
          },
        });

        // Add start position marker (flag/pin)
        const startEl = document.createElement('div');
        startEl.className = 'zonna-start-marker';
        startEl.innerHTML = `
          <div style="
            width: 24px;
            height: 24px;
            background: ${GUIDE_LINE_COLOR};
            border: 2px solid #fff;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            </svg>
          </div>
        `;
        
        startMarkerRef.current = new maplibregl.Marker({ element: startEl })
          .setLngLat([startPosition[1], startPosition[0]])
          .addTo(map.current);
      } else {
        guideSource.setData({ type: 'FeatureCollection', features: [] });
      }
    }
  }, [startPosition, userPosition, loaded]);

  // Smooth camera follow (2D - no rotation, just center tracking)
  useEffect(() => {
    if (!map.current || !loaded || !userPosition || !followUser) return;

    map.current.easeTo({
      center: [userPosition[1], userPosition[0]],
      bearing: 0, // Keep north up in 2D mode
      duration: 1000,
      easing: (t) => t * (2 - t), // Smooth easeOut
    });
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
  }, [trailColor, loaded]);

  // Update conquests with nickname data for popup
  useEffect(() => {
    if (!map.current || !loaded) return;

    const source = map.current.getSource('conquests') as maplibregl.GeoJSONSource;
    if (!source) return;

    const features = conquests.map((conquest) => ({
      type: 'Feature' as const,
      properties: {
        id: conquest.id,
        area: conquest.area,
        nickname: conquest.profile?.nickname || conquest.profile?.name || 'Desconhecido',
        color: trailColor,
        selected: conquest.id === selectedConquest?.id,
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [conquest.path.map(([lat, lng]) => [lng, lat])],
      },
    }));

    source.setData({ type: 'FeatureCollection', features });
  }, [conquests, selectedConquest, loaded, trailColor]);

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

  // Victory zoom out effect (2D - no pitch change)
  useEffect(() => {
    if (!map.current || !loaded || !onVictoryZoom) return;

    map.current.easeTo({
      zoom: 14,
      pitch: 0, // Stay flat
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
