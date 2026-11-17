import { config } from '../config/env.js';
import { getRedisClient } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { coordCacheKey } from '../utils/geo.js';

const GEOCODE_CACHE_TTL_SEC = 7 * 24 * 3600;

function parseGoogleComponents(components = []) {
    const find = (...types) =>
        components.find((c) => types.some((t) => (c.types || []).includes(t)))?.long_name || '';

    const subLocality1 = find('sublocality_level_1');
    const subLocality = find('sublocality');
    const neighborhood = find('neighborhood');

    return {
        area: subLocality1 || subLocality || neighborhood || '',
        city: find('locality', 'administrative_area_level_2'),
        state: find('administrative_area_level_1'),
        country: find('country') || 'India',
        postalCode: find('postal_code'),
    };
}

function fallbackCoords(lat, lng) {
    return {
        latitude: lat,
        longitude: lng,
        area: '',
        city: '',
        state: '',
        country: 'India',
        postalCode: '',
        formattedAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        source: 'coords_only',
    };
}

async function reverseGeocodeWithBigDataCloud(lat, lng) {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return null;
        const bdc = await res.json();
        const area = bdc.locality || bdc.principalSubdivision || '';
        const city = bdc.city || bdc.locality || '';
        const state = bdc.principalSubdivision || '';
        const country = bdc.countryName || 'India';
        const postalCode = bdc.postcode || '';
        const formattedAddress = [area, city, state, country].filter(Boolean).join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        return {
            latitude: lat,
            longitude: lng,
            area,
            city,
            state,
            country,
            postalCode,
            formattedAddress,
            address: area || city || formattedAddress,
            source: 'bigdatacloud',
        };
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

export async function reverseGeocode(latitude, longitude) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return fallbackCoords(0, 0);
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return fallbackCoords(lat, lng);
    }

    const key = coordCacheKey(lat, lng);
    const cacheKey = key ? `geocode:rev:${key}` : null;

    try {
        const redis = getRedisClient();
        if (redis && cacheKey) {
            const cached = await redis.get(cacheKey);
            if (cached) return JSON.parse(cached);
        }
    } catch (err) {
        logger.warn(`Geocode cache read failed: ${err.message}`);
    }

    const apiKey = config.googleMapsApiKey;
    let result = null;

    if (apiKey) {
        try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=en`;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            try {
                const res = await fetch(url, { signal: controller.signal });
                const data = await res.json();
                if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
                    const top = data.results[0];
                    const parts = parseGoogleComponents(top.address_components || []);
                    const formattedAddress = top.formatted_address || '';
                    const displayAddress = parts.area || parts.city || formattedAddress.split(',')[0]?.trim() || '';

                    result = {
                        latitude: lat,
                        longitude: lng,
                        ...parts,
                        formattedAddress,
                        address: displayAddress,
                        source: 'google',
                    };
                } else {
                    logger.warn(`Google reverse geocode not OK (${data.status}): ${data.error_message || 'No error message'}`);
                }
            } finally {
                clearTimeout(timeout);
            }
        } catch (err) {
            logger.warn(`Google reverse geocode request failed: ${err.message}`);
        }
    }

    // Secondary fallback: BigDataCloud
    if (!result) {
        try {
            result = await reverseGeocodeWithBigDataCloud(lat, lng);
        } catch (err) {
            logger.warn(`BigDataCloud reverse geocode fallback failed: ${err.message}`);
        }
    }

    // Tertiary fallback: coords only
    if (!result) {
        result = fallbackCoords(lat, lng);
    }

    try {
        const redis = getRedisClient();
        if (redis && cacheKey && result.source !== 'coords_only') {
            await redis.set(cacheKey, JSON.stringify(result), { EX: GEOCODE_CACHE_TTL_SEC });
        }
    } catch (err) {
        logger.warn(`Geocode cache write failed: ${err.message}`);
    }

    return result;
}
