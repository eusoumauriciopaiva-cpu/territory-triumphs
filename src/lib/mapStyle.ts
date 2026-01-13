// ZONNA High-Contrast Dark Map Style (Strava-inspired)
// Focused on natural areas visibility and clean training aesthetics

export const ZONNA_DARK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  name: 'ZONNA Dark',
  sources: {
    openmaptiles: {
      type: 'vector',
      url: 'https://api.maptiler.com/tiles/v3/tiles.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL',
    },
  },
  glyphs: 'https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=get_your_own_OpIi9ZULNHzrESv6T2vL',
  layers: [
    // Background - Dark charcoal
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#1a1a1b',
      },
    },
    // Land areas
    {
      id: 'landcover',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      paint: {
        'fill-color': '#1a1a1b',
        'fill-opacity': 1,
      },
    },
    // Natural/Forest - Dark moss green (Strava style)
    {
      id: 'landcover-grass',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['==', 'class', 'grass'],
      paint: {
        'fill-color': '#1b2d26',
        'fill-opacity': 1,
      },
    },
    {
      id: 'landcover-wood',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['==', 'class', 'wood'],
      paint: {
        'fill-color': '#1b2d26',
        'fill-opacity': 1,
      },
    },
    // Parks - Dark moss green
    {
      id: 'park',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'park',
      paint: {
        'fill-color': '#1b2d26',
        'fill-opacity': 1,
      },
    },
    {
      id: 'landuse-park',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landuse',
      filter: ['any',
        ['==', 'class', 'park'],
        ['==', 'class', 'cemetery'],
        ['==', 'class', 'pitch'],
        ['==', 'class', 'playground'],
      ],
      paint: {
        'fill-color': '#1b2d26',
        'fill-opacity': 1,
      },
    },
    // Water - Deep black
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: {
        'fill-color': '#111111',
        'fill-opacity': 1,
      },
    },
    {
      id: 'waterway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'waterway',
      paint: {
        'line-color': '#111111',
        'line-width': 2,
      },
    },
    // Buildings
    {
      id: 'building',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'building',
      paint: {
        'fill-color': '#252525',
        'fill-opacity': 0.8,
      },
    },
    // Minor roads
    {
      id: 'road-minor',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['all',
        ['==', '$type', 'LineString'],
        ['in', 'class', 'minor', 'service', 'path', 'track'],
      ],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#2a2a2a',
        'line-width': 1,
      },
    },
    // Secondary roads
    {
      id: 'road-secondary',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['all',
        ['==', '$type', 'LineString'],
        ['in', 'class', 'secondary', 'tertiary'],
      ],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#333333',
        'line-width': 2,
      },
    },
    // Primary roads
    {
      id: 'road-primary',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['all',
        ['==', '$type', 'LineString'],
        ['==', 'class', 'primary'],
      ],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#383838',
        'line-width': 3,
      },
    },
    // Main highways
    {
      id: 'road-highway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['all',
        ['==', '$type', 'LineString'],
        ['in', 'class', 'motorway', 'trunk'],
      ],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#383838',
        'line-width': 4,
      },
    },
    // Street labels - White at 60% opacity
    {
      id: 'road-label',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'transportation_name',
      filter: ['==', '$type', 'LineString'],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 11,
        'symbol-placement': 'line',
        'text-max-angle': 30,
        'text-rotation-alignment': 'map',
      },
      paint: {
        'text-color': 'rgba(255, 255, 255, 0.6)',
        'text-halo-color': 'rgba(0, 0, 0, 0.5)',
        'text-halo-width': 1,
      },
    },
    // Place labels (neighborhoods, cities)
    {
      id: 'place-label',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['in', 'class', 'city', 'town', 'village', 'suburb', 'neighbourhood'],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Bold'],
        'text-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 12,
          14, 16,
        ],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.1,
      },
      paint: {
        'text-color': 'rgba(255, 255, 255, 0.6)',
        'text-halo-color': 'rgba(0, 0, 0, 0.5)',
        'text-halo-width': 1,
      },
    },
  ],
} as maplibregl.StyleSpecification;

// Fallback to CartoDB dark style with custom modifications
export const CARTO_DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// Custom style modifications to apply after loading CartoDB style
export function applyZonnaStyleOverrides(map: maplibregl.Map) {
  // Wait for style to load
  if (!map.isStyleLoaded()) {
    map.once('style.load', () => applyZonnaStyleOverrides(map));
    return;
  }

  const layers = map.getStyle()?.layers || [];

  layers.forEach((layer) => {
    const layerId = layer.id;

    // Water - Deep black
    if (layerId.includes('water')) {
      if (layer.type === 'fill') {
        map.setPaintProperty(layerId, 'fill-color', '#111111');
      } else if (layer.type === 'line') {
        map.setPaintProperty(layerId, 'line-color', '#111111');
      }
    }

    // Natural areas - Dark moss green (Strava style)
    if (
      layerId.includes('park') ||
      layerId.includes('grass') ||
      layerId.includes('wood') ||
      layerId.includes('forest') ||
      layerId.includes('green') ||
      layerId.includes('vegetation') ||
      layerId.includes('landcover')
    ) {
      if (layer.type === 'fill') {
        map.setPaintProperty(layerId, 'fill-color', '#1b2d26');
      }
    }

    // Background/Land - Dark charcoal
    if (layerId === 'background' || layerId.includes('land') && !layerId.includes('park')) {
      if (layer.type === 'background') {
        map.setPaintProperty(layerId, 'background-color', '#1a1a1b');
      } else if (layer.type === 'fill' && !layerId.includes('park') && !layerId.includes('wood') && !layerId.includes('grass')) {
        map.setPaintProperty(layerId, 'fill-color', '#1a1a1b');
      }
    }

    // Roads - Medium gray
    if (layerId.includes('road') || layerId.includes('highway') || layerId.includes('motorway')) {
      if (layer.type === 'line') {
        map.setPaintProperty(layerId, 'line-color', '#383838');
      }
    }

    // Street labels - White at 60% opacity
    if (layerId.includes('label') || layerId.includes('name')) {
      if (layer.type === 'symbol') {
        map.setPaintProperty(layerId, 'text-color', 'rgba(255, 255, 255, 0.6)');
        map.setPaintProperty(layerId, 'text-halo-color', 'rgba(0, 0, 0, 0.5)');
        map.setPaintProperty(layerId, 'text-halo-width', 1);
      }
    }

    // Hide POIs (commercial icons) - Clean training mode
    if (
      layerId.includes('poi') ||
      layerId.includes('icon') ||
      layerId.includes('shop') ||
      layerId.includes('amenity') ||
      layerId.includes('place-') && !layerId.includes('place-label')
    ) {
      map.setLayoutProperty(layerId, 'visibility', 'none');
    }
  });
}
