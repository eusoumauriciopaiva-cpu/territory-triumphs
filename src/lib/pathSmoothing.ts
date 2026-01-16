/**
 * Path smoothing utilities for GPS tracking
 * Implements moving average and simplification algorithms
 */

/**
 * Calculate distance between two points in meters
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Moving average smoothing - reduces jitter while preserving path shape
 * @param points Array of [lat, lng] coordinates
 * @param windowSize Number of points to average (default: 3)
 */
export function smoothPath(
  points: [number, number][],
  windowSize: number = 3
): [number, number][] {
  if (points.length <= windowSize) return points;

  const smoothed: [number, number][] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < points.length; i++) {
    if (i < halfWindow || i >= points.length - halfWindow) {
      // Keep edge points unchanged
      smoothed.push(points[i]);
    } else {
      // Average surrounding points
      let sumLat = 0;
      let sumLng = 0;
      for (let j = i - halfWindow; j <= i + halfWindow; j++) {
        sumLat += points[j][0];
        sumLng += points[j][1];
      }
      smoothed.push([
        sumLat / windowSize,
        sumLng / windowSize,
      ]);
    }
  }

  return smoothed;
}

/**
 * Simplify path using Douglas-Peucker algorithm
 * Reduces number of points while preserving shape
 * @param points Array of [lat, lng] coordinates
 * @param tolerance Distance tolerance in meters (default: 5m)
 */
export function simplifyPath(
  points: [number, number][],
  tolerance: number = 5
): [number, number][] {
  if (points.length <= 2) return points;

  // Convert tolerance from meters to degrees (approximate)
  const toleranceDeg = tolerance / 111000; // ~111km per degree

  function perpendicularDistance(
    point: [number, number],
    lineStart: [number, number],
    lineEnd: [number, number]
  ): number {
    const [px, py] = point;
    const [x1, y1] = lineStart;
    const [x2, y2] = lineEnd;

    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx: number, yy: number;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function douglasPeucker(
    pointList: [number, number][],
    epsilon: number
  ): [number, number][] {
    if (pointList.length <= 2) return pointList;

    let maxDistance = 0;
    let maxIndex = 0;
    const end = pointList.length - 1;

    for (let i = 1; i < end; i++) {
      const distance = perpendicularDistance(
        pointList[i],
        pointList[0],
        pointList[end]
      );

      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }

    if (maxDistance > epsilon) {
      const left = douglasPeucker(
        pointList.slice(0, maxIndex + 1),
        epsilon
      );
      const right = douglasPeucker(pointList.slice(maxIndex), epsilon);

      return [...left.slice(0, -1), ...right];
    } else {
      return [pointList[0], pointList[end]];
    }
  }

  return douglasPeucker(points, toleranceDeg);
}

/**
 * Apply both smoothing and simplification
 * @param points Array of [lat, lng] coordinates
 * @param smoothWindow Window size for moving average (default: 3)
 * @param simplifyTolerance Tolerance for simplification in meters (default: 5)
 */
export function optimizePath(
  points: [number, number][],
  smoothWindow: number = 3,
  simplifyTolerance: number = 5
): [number, number][] {
  if (points.length === 0) return points;
  
  // First smooth to reduce jitter
  const smoothed = smoothPath(points, smoothWindow);
  
  // Then simplify to reduce point count
  return simplifyPath(smoothed, simplifyTolerance);
}

/**
 * Filter GPS points by accuracy and movement
 * @param points Array of [lat, lng] coordinates with optional accuracy
 * @param minAccuracy Maximum allowed accuracy in meters (default: 20)
 * @param minDistance Minimum distance between points in meters (default: 3)
 */
export function filterGPSPoints(
  points: Array<{ lat: number; lng: number; accuracy?: number }>,
  minAccuracy: number = 20,
  minDistance: number = 3
): [number, number][] {
  if (points.length === 0) return [];

  const filtered: [number, number][] = [];
  let lastPoint: [number, number] | null = null;

  for (const point of points) {
    // Filter by accuracy
    if (point.accuracy && point.accuracy > minAccuracy) {
      continue;
    }

    const currentPoint: [number, number] = [point.lat, point.lng];

    // Filter by minimum distance
    if (lastPoint) {
      const distance = haversineDistance(
        lastPoint[0],
        lastPoint[1],
        currentPoint[0],
        currentPoint[1]
      );

      if (distance < minDistance) {
        continue;
      }
    }

    filtered.push(currentPoint);
    lastPoint = currentPoint;
  }

  return filtered;
}
