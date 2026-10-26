import { getIO } from '../config/socket.js';
import { logger } from '../utils/logger.js';
import { resetNotificationLogoCache } from '../utils/brandAssets.js';

/**
 * Tells every connected app (customer, restaurant, delivery, admin) that shared data changed,
 * so they drop cached copies and reload: business settings, theme, fees, zones, categories,
 * banners, menus, outlet timings, restaurant status, offers...
 *
 * Emits Socket.IO `app_data_changed` { scope, restaurantId?, path, at } after a successful
 * write. Order/location/auth/payment traffic is excluded: it is high-volume and has its own
 * dedicated real-time events.
 */

// Writes that never change shared catalogue/config data.
const EXCLUDED = /\/(orders?|location|availability|fcm-tokens|notifications|auth|login|logout|register|signup|otp|refresh|payments?|webhook|wallet|withdraw|deposit|cart|favorites?|support-tickets|search|delivery|driver|user)(\/|$)/i;

function resolveScope(path) {
    if (/^\/v1\/app-config/.test(path)) return 'theme';
    if (/^\/v1\/food\/admin\/env/.test(path)) return 'env';
    if (/^\/v1\/food\/admin\/business-settings/.test(path)) return 'settings';
    if (/^\/v1\/food\/admin\//.test(path)) return 'admin';
    if (/^\/v1\/food\/restaurant\//.test(path)) return 'restaurant';
    if (/^\/v1\/food\/promocodes/.test(path)) return 'offers';
    if (/^\/v1\/food\//.test(path)) return 'landing';
    return null;
}

const DEBOUNCE_MS = 750;
const pending = new Map(); // scope -> { timer, payload }

function queueBroadcast(payload) {
    const existing = pending.get(payload.scope);
    if (existing) clearTimeout(existing.timer);
    const timer = setTimeout(() => {
        pending.delete(payload.scope);
        try {
            if (['settings', 'admin', 'theme'].includes(payload.scope)) resetNotificationLogoCache();
            getIO().emit('app_data_changed', { ...payload, at: Date.now() });
        } catch (err) {
            logger.warn(`[DataSync] broadcast failed: ${err.message}`);
        }
    }, DEBOUNCE_MS);
    pending.set(payload.scope, { timer, payload });
}

export const broadcastDataChanges = (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const path = String(req.originalUrl || '').split('?')[0].replace(/^\/api(?=\/)/, '');
    const scope = resolveScope(path);
    if (!scope || EXCLUDED.test(path.replace(/^\/v1\/food\/(admin|restaurant)/, ''))) return next();

    res.on('finish', () => {
        if (res.statusCode >= 400) return;
        const role = req.user?.role;
        queueBroadcast({
            scope,
            path,
            restaurantId: role === 'RESTAURANT' ? String(req.user?.userId || '') : undefined,
        });
    });
    next();
};
