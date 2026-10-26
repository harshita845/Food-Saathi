import { useEffect, useState } from "react";
import { invalidatePublicApiCaches } from "@food/api";
import { clearOutletTimingsCache } from "@food/utils/outletTimingsCache";
import { loadBusinessSettings, clearCache as clearBusinessSettingsCache } from "@food/utils/businessSettings";

/**
 * Keeps every app (customer, restaurant, delivery, admin) in step with the database.
 *
 * The backend broadcasts `app_data_changed` over Socket.IO whenever the admin panel or a
 * restaurant changes shared data (settings, menus, timings, banners, zones, fees...).
 * On that event we drop every cached response and tell open pages to reload.
 */
export const DATA_CHANGED_EVENT = "app-data-changed";

let lastHandledAt = 0;

export function handleDataChanged(payload = {}) {
  // Several sockets (user/restaurant/delivery/admin) may deliver the same event; handle it once.
  const at = Number(payload?.at) || Date.now();
  if (at && at === lastHandledAt) return;
  lastHandledAt = at;

  invalidatePublicApiCaches();
  clearOutletTimingsCache();

  const scope = String(payload?.scope || "");
  if (scope === "settings" || scope === "admin" || scope === "theme") {
    clearBusinessSettingsCache();
    loadBusinessSettings()
      .then(() => window.dispatchEvent(new CustomEvent("businessSettingsUpdated")))
      .catch(() => {});
  }
  if (scope === "theme" || scope === "admin") {
    import("@food/utils/themeSettings.js")
      .then((m) => m.applyDynamicTheme?.())
      .catch(() => {});
  }

  window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { detail: payload }));
}

/** Attach the listener to a Socket.IO client (safe to call more than once). */
export function bindDataSync(socket) {
  if (!socket || typeof socket.on !== "function") return;
  socket.off?.("app_data_changed", handleDataChanged);
  socket.on("app_data_changed", handleDataChanged);
}

/**
 * Counter that increases whenever shared data changes. Add it to a fetch effect's
 * dependencies so the page reloads its data automatically.
 */
export function useDataVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(DATA_CHANGED_EVENT, bump);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, bump);
  }, []);
  return version;
}
