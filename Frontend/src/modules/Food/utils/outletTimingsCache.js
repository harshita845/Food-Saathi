import { restaurantAPI } from "@food/api";

const cache = new Map(); // id -> { at, value }
const inFlight = new Map();
// Restaurants edit their hours at any time; never trust a cached copy for long.
const CACHE_TTL_MS = 60 * 1000;

const readCache = (id) => {
  const entry = cache.get(id);
  if (!entry) return undefined;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    cache.delete(id);
    return undefined;
  }
  return entry.value;
};

/** Short-lived cache + in-flight dedupe for outlet timings (viewport-deferred fetch). */
export async function fetchOutletTimingsOnce(restaurantId) {
  const id = String(restaurantId || "").trim();
  if (!id) return null;
  const cached = readCache(id);
  if (cached !== undefined) return cached;
  if (inFlight.has(id)) return inFlight.get(id);

  const promise = (async () => {
    try {
      const response = await restaurantAPI.getOutletTimingsByRestaurantId(id);
      const timings =
        response?.data?.data?.outletTimings ||
        response?.data?.outletTimings ||
        null;
      cache.set(id, { at: Date.now(), value: timings });
      return timings;
    } catch {
      // Don't cache failures: try again next time.
      return null;
    } finally {
      inFlight.delete(id);
    }
  })();

  inFlight.set(id, promise);
  return promise;
}

export function primeOutletTimingsCache(restaurantId, timings) {
  const id = String(restaurantId || "").trim();
  if (!id || timings == null) return;
  cache.set(id, { at: Date.now(), value: timings });
}
