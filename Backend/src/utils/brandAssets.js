import { FoodBusinessSettings } from '../modules/food/admin/models/businessSettings.model.js';
import { logger } from './logger.js';

const CACHE_MS = 5 * 60 * 1000;
let cachedLogoUrl = null;
let cachedAt = 0;

/**
 * Logo shown in push notifications: the logo uploaded in admin Business Settings,
 * falling back to BRAND_LOGO_URL from the environment.
 */
export async function getNotificationLogoUrl() {
    if (cachedLogoUrl !== null && Date.now() - cachedAt < CACHE_MS) return cachedLogoUrl;
    let url = '';
    try {
        const settings = await FoodBusinessSettings.findOne().select('logo userLogo').lean();
        url = settings?.logo?.url || settings?.userLogo?.url || '';
    } catch (err) {
        logger.warn(`Could not load business logo for notifications: ${err.message}`);
    }
    cachedLogoUrl = url || process.env.BRAND_LOGO_URL || '';
    cachedAt = Date.now();
    return cachedLogoUrl;
}

/** Forget the cached logo (called when business settings or the theme change). */
export function resetNotificationLogoCache() {
    cachedLogoUrl = null;
    cachedAt = 0;
}
