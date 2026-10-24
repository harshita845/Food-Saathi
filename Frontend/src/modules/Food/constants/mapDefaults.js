// Map centre used only before a real location is known (GPS off, no saved address).
// Configure per deployment with VITE_DEFAULT_MAP_LAT / VITE_DEFAULT_MAP_LNG.
const parseCoord = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const DEFAULT_MAP_LAT = parseCoord(import.meta.env.VITE_DEFAULT_MAP_LAT, 22.7196);
export const DEFAULT_MAP_LNG = parseCoord(import.meta.env.VITE_DEFAULT_MAP_LNG, 75.8577);
