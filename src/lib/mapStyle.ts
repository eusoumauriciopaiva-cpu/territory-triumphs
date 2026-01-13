import maplibregl from 'maplibre-gl';

// Map style types - now includes 'standard' for Google Maps-like appearance
export type MapStyleType = 'standard' | 'satellite';

// ZONNA Standard Style - Google Maps-like appearance
// Light theme with green parks, white roads, blue water
export const ZONNA_STANDARD_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  name: 'ZONNA Standard',
  sources: {
    openmaptiles: {
      type: 'vector',
      url: 'https://api.maptiler.com/tiles/v3/tiles.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL',
    },
  },
  glyphs: 'https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=get_your_own_OpIi9ZULNHzrESv6T2vL',
  layers: [
    // Background - Light gray (Google Maps style)
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#f5f5f5',
      },
    },
    // Land areas - Light beige/cream
    {
      id: 'landcover',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      paint: {
        'fill-color': '#f5f5f5',
        'fill-opacity': 1,
      },
    },
    // Natural/Forest - Light green (Google Maps style)
    {
      id: 'landcover-grass',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['==', 'class', 'grass'],
      paint: {
        'fill-color': '#c8e6c9',
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
        'fill-color': '#a5d6a7',
        'fill-opacity': 1,
      },
    },
    // Parks - Light green
    {
      id: 'park',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'park',
      paint: {
        'fill-color': '#c8e6c9',
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
        'fill-color': '#c8e6c9',
        'fill-opacity': 1,
      },
    },
    // Water - Light blue (Google Maps style)
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: {
        'fill-color': '#a0d4e7',
        'fill-opacity': 1,
      },
    },
    {
      id: 'waterway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'waterway',
      paint: {
        'line-color': '#a0d4e7',
        'line-width': 2,
      },
    },
    // Buildings - Light gray
    {
      id: 'building',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'building',
      paint: {
        'fill-color': '#e8e8e8',
        'fill-opacity': 0.9,
      },
    },
    // Minor roads - White with light gray outline
    {
      id: 'road-minor-outline',
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
        'line-color': '#d9d9d9',
        'line-width': 3,
      },
    },
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
        'line-color': '#ffffff',
        'line-width': 2,
      },
    },
    // Secondary roads - White with gray outline
    {
      id: 'road-secondary-outline',
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
        'line-color': '#d9d9d9',
        'line-width': 5,
      },
    },
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
        'line-color': '#ffffff',
        'line-width': 4,
      },
    },
    // Primary roads - White with gray outline
    {
      id: 'road-primary-outline',
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
        'line-color': '#d9d9d9',
        'line-width': 7,
      },
    },
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
        'line-color': '#ffffff',
        'line-width': 6,
      },
    },
    // Main highways - Yellow/Orange (Google Maps style)
    {
      id: 'road-highway-outline',
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
        'line-color': '#e5a83a',
        'line-width': 9,
      },
    },
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
        'line-color': '#fdd835',
        'line-width': 8,
      },
    },
    // Street labels - Dark gray
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
        'text-color': '#333333',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2,
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
        'text-color': '#666666',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2,
      },
    },
  ],
} as maplibregl.StyleSpecification;

// CartoDB Positron (light style) for Google Maps-like appearance
export const CARTO_POSITRON_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

// Custom style modifications to apply after loading CartoDB Positron style
export function applyStandardStyleOverrides(map: maplibregl.Map) {
  // Wait for style to load
  if (!map.isStyleLoaded()) {
    map.once('style.load', () => applyStandardStyleOverrides(map));
    return;
  }

  const layers = map.getStyle()?.layers || [];

  layers.forEach((layer) => {
    const layerId = layer.id;

    // Water - Light blue (Google Maps style)
    if (layerId.includes('water')) {
      if (layer.type === 'fill') {
        map.setPaintProperty(layerId, 'fill-color', '#a0d4e7');
      } else if (layer.type === 'line') {
        map.setPaintProperty(layerId, 'line-color', '#a0d4e7');
      }
    }

    // Natural areas - Light green (Google Maps style)
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
        map.setPaintProperty(layerId, 'fill-color', '#c8e6c9');
      }
    }

    // Hide POIs (commercial icons) - Clean training mode
    if (
      layerId.includes('poi') ||
      layerId.includes('icon') ||
      layerId.includes('shop') ||
      layerId.includes('amenity')
    ) {
      map.setLayoutProperty(layerId, 'visibility', 'none');
    }
  });
}

// ESRI Satellite Style (free, no API key required)
export const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  name: 'ZONNA Satellite',
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: 'Esri, Maxar, Earthstar Geographics',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 22,
      paint: {
        'raster-opacity': 1,
        'raster-saturation': 0.1,
        'raster-contrast': 0.1,
      },
    },
  ],
};

// Get style by type
export function getMapStyleUrl(styleType: MapStyleType): string | maplibregl.StyleSpecification {
  switch (styleType) {
    case 'satellite':
      return SATELLITE_STYLE;
    case 'standard':
    default:
      return CARTO_POSITRON_STYLE;
  }
}

// Check if style needs standard overrides (for CartoDB Positron)
export function needsStandardOverrides(styleType: MapStyleType): boolean {
  return styleType === 'standard';
}
