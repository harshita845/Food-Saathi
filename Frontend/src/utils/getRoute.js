/**
 * Shared routing helper using Google Maps Routes API (computeRoutes)
 * with caching, distance/time throttling, and fallback road routing (OSRM / geometric).
 */

const routeCache = new Map();
const inFlightRequests = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Calculates Haversine distance in meters between two coordinates.
 */
export function getHaversineDistanceMeters(p1, p2) {
  if (!p1 || !p2) return Infinity;
  const lat1 = Number(p1.lat ?? p1.latitude);
  const lng1 = Number(p1.lng ?? p1.longitude);
  const lat2 = Number(p2.lat ?? p2.latitude);
  const lng2 = Number(p2.lng ?? p2.longitude);
  if (!Number.isFinite(lat1) || !Number.isFinite(lng1) || !Number.isFinite(lat2) || !Number.isFinite(lng2)) {
    return Infinity;
  }

  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Returns true if origin moved more than thresholdMeters from reference location.
 */
export function hasMovedSignificantly(prevLoc, currentLoc, thresholdMeters = 50) {
  if (!prevLoc || !currentLoc) return true;
  return getHaversineDistanceMeters(prevLoc, currentLoc) >= thresholdMeters;
}

/**
 * Encodes array of {lat, lng} into a standard Google encoded polyline string.
 */
export function encodePolyline(points) {
  if (!Array.isArray(points) || points.length === 0) return '';
  if (window.google?.maps?.geometry?.encoding?.encodePath) {
    try {
      const latLngs = points.map((p) => new window.google.maps.LatLng(p.lat, p.lng));
      return window.google.maps.geometry.encoding.encodePath(latLngs);
    } catch {
      // Fall through to algorithmic encoding
    }
  }

  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const lat = Math.round(Number(p.lat ?? p.latitude) * 1e5);
    const lng = Math.round(Number(p.lng ?? p.longitude) * 1e5);

    let dLat = lat - prevLat;
    let dLng = lng - prevLng;

    prevLat = lat;
    prevLng = lng;

    for (let val of [dLat, dLng]) {
      val = val < 0 ? ~(val << 1) : val << 1;
      while (val >= 0x20) {
        encoded += String.fromCharCode((0x20 | (val & 0x1f)) + 63);
        val >>= 5;
      }
      encoded += String.fromCharCode(val + 63);
    }
  }

  return encoded;
}

/**
 * Normalize point to { lat, lng }
 */
function normCoord(pt) {
  if (!pt) return null;
  const lat = Number(pt.lat ?? pt.latitude);
  const lng = Number(pt.lng ?? pt.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/**
 * Generates cache key by rounding coordinates to 4 decimal places (~11m resolution).
 */
function getCacheKey(origin, destination, travelMode) {
  return `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}:${travelMode}`;
}

/**
 * Fallback route via OSRM or linear interpolation.
 */
async function fetchFallbackRoute(origin, destination) {
  // 1. Try public OSRM driving route
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const res = await fetch(osrmUrl, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      const route = data.routes?.[0];
      if (route && Array.isArray(route.geometry?.coordinates) && route.geometry.coordinates.length > 1) {
        const path = route.geometry.coordinates.map(([lng, lat]) => ({ lat: Number(lat), lng: Number(lng) }));
        const distanceMeters = Number(route.distance || 0);
        const durationSec = Number(route.duration || 0);
        const distanceKm = Number((distanceMeters / 1000).toFixed(2));
        const etaMin = Math.max(1, Math.round(durationSec / 60));
        return {
          path,
          distanceKm,
          etaMin,
          durationText: `${etaMin} min${etaMin > 1 ? 's' : ''}`,
          distanceText: `${distanceKm} km`,
          encodedPolyline: encodePolyline(path),
          source: 'osrm',
        };
      }
    }
  } catch (err) {
    // console.warn('[getRoute] OSRM fallback failed:', err?.message);
  }

  // 2. Linear interpolated steps along straight line
  const numSteps = 12;
  const path = [];
  for (let i = 0; i <= numSteps; i++) {
    const fraction = i / numSteps;
    const lat = origin.lat + (destination.lat - origin.lat) * fraction;
    const lng = origin.lng + (destination.lng - origin.lng) * fraction;
    path.push({ lat, lng });
  }

  const approxDistMeters = getHaversineDistanceMeters(origin, destination);
  const distanceKm = Number((approxDistMeters / 1000).toFixed(2));
  const estMins = Math.max(1, Math.round((approxDistMeters / 1000) * 2.4));

  return {
    path,
    distanceKm,
    etaMin: estMins,
    durationText: `${estMins} min${estMins > 1 ? 's' : ''}`,
    distanceText: `${distanceKm} km`,
    encodedPolyline: encodePolyline(path),
    source: 'interpolated',
  };
}

/**
 * Fetches route between origin and destination using Google Maps Routes API (Route.computeRoutes),
 * with in-memory caching and fallback road routing.
 *
 * @param {{ lat: number, lng: number }} rawOrigin
 * @param {{ lat: number, lng: number }} rawDestination
 * @param {{ travelMode?: string, force?: boolean }} [options]
 * @returns {Promise<{ path: Array<{lat: number, lng: number}>, distanceKm: number, etaMin: number, durationText: string, distanceText: string, encodedPolyline: string }>}
 */
export async function getRoute(rawOrigin, rawDestination, options = {}) {
  const origin = normCoord(rawOrigin);
  const destination = normCoord(rawDestination);

  if (!origin || !destination) {
    throw new Error('[getRoute] Invalid origin or destination coordinates.');
  }

  const travelMode = options.travelMode === 'TWO_WHEELER' ? 'TWO_WHEELER' : 'DRIVE';
  const cacheKey = getCacheKey(origin, destination, travelMode);

  // Check cache unless force is specified
  if (!options.force && routeCache.has(cacheKey)) {
    const cached = routeCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    routeCache.delete(cacheKey);
  }

  // Deduplicate in-flight requests
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const routePromise = (async () => {
    try {
      // 1. Try Google Maps Routes API (Routes Library)
      if (window.google?.maps?.importLibrary) {
        const { Route } = await window.google.maps.importLibrary('routes');
        if (Route?.computeRoutes) {
          const originPoint = window.google?.maps?.LatLng
            ? new window.google.maps.LatLng(origin.lat, origin.lng)
            : { lat: origin.lat, lng: origin.lng };
          const destinationPoint = window.google?.maps?.LatLng
            ? new window.google.maps.LatLng(destination.lat, destination.lng)
            : { lat: destination.lat, lng: destination.lng };

          // The Maps JS Route class takes google.maps.TravelMode values ('DRIVING', 'TWO_WHEELER'),
          // not the REST API names ('DRIVE'). Sending 'DRIVE' is rejected and forces the fallback route.
          const TM = window.google?.maps?.TravelMode || {};
          const jsTravelMode = travelMode === 'TWO_WHEELER'
            ? (TM.TWO_WHEELER || 'TWO_WHEELER')
            : (TM.DRIVING || 'DRIVING');

          const request = {
            origin: originPoint,
            destination: destinationPoint,
            travelMode: jsTravelMode,
            fields: ['path', 'distanceMeters', 'durationMillis'],
          };

          const response = await Route.computeRoutes(request);
          if (response?.routes?.length > 0) {
            const primaryRoute = response.routes[0];
            const rawPath = primaryRoute.path || [];
            const path = rawPath.map((pt) => ({
              lat: typeof pt.lat === 'function' ? pt.lat() : Number(pt.lat ?? pt.latitude),
              lng: typeof pt.lng === 'function' ? pt.lng() : Number(pt.lng ?? pt.longitude),
            })).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

            if (path.length > 1) {
              const distanceMeters = Number(primaryRoute.distanceMeters || 0);
              const durationMillis = Number(primaryRoute.durationMillis || 0);
              const distanceKm = Number((distanceMeters / 1000).toFixed(2));
              const etaMin = Math.max(1, Math.round(durationMillis / 60000));
              const result = {
                path,
                distanceKm,
                etaMin,
                durationText: `${etaMin} min${etaMin > 1 ? 's' : ''}`,
                distanceText: `${distanceKm} km`,
                encodedPolyline: encodePolyline(path),
                source: 'google-routes',
              };

              routeCache.set(cacheKey, { data: result, timestamp: Date.now() });
              return result;
            }
          }
        }
      }
    } catch (err) {
      console.warn('[getRoute] Google Routes API failed or not enabled, using fallback routing:', err?.message || err);
    }

    // 2. Fallback routing
    const fallbackResult = await fetchFallbackRoute(origin, destination);
    routeCache.set(cacheKey, { data: fallbackResult, timestamp: Date.now() });
    return fallbackResult;
  })().finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, routePromise);
  return routePromise;
}

export default getRoute;

