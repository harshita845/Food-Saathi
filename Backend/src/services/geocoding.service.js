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

function cleanAdministrativeName(str = '') {
    if (!str) return '';
    // If it's a Tehsil/Tahsil administrative revenue block (e.g. "Juni Indore Tahsil", "Indore Tahsil", "Rau Tahsil"),
    // stripping only the word "Tahsil" leaves a misleading administrative Tehsil name that is NOT the locality.
    if (/\b(tahsil|tehsil|taluk|sub-district|subdistrict)\b/i.test(str)) {
        return '';
    }
    return str
        .replace(/\b(district|circle|mandal)\b/gi, '')
        .replace(/\s+City\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function resolveKnownLandmark(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    // 1. Corporate House, 169, RNT Marg, South Tukoganj, Indore (lat: 22.71755, lng: 75.87178)
    const distToCorporateHouse = Math.hypot(
        (lat - 22.7175512) * 111320,
        (lng - 75.8717763) * 111320 * 0.9224
    );
    if (distToCorporateHouse <= 450) {
        return {
            latitude: lat,
            longitude: lng,
            area: 'Corporate House',
            city: 'Indore',
            state: 'Madhya Pradesh',
            country: 'India',
            postalCode: '452001',
            formattedAddress: 'Corporate House, 169, RNT Marg, South Tukoganj, Indore, Madhya Pradesh 452001, India',
            address: 'Corporate House, 169, RNT Marg, South Tukoganj, Indore',
            mainTitle: 'Corporate House',
            source: 'landmark_exact',
        };
    }

    // 2. Treasure Island (TI Next) Mall, South Tukoganj / MG Road (lat: 22.7208, lng: 75.8785)
    const distToTIMall = Math.hypot(
        (lat - 22.7208) * 111320,
        (lng - 75.8785) * 111320 * 0.9224
    );
    if (distToTIMall <= 350) {
        return {
            latitude: lat,
            longitude: lng,
            area: 'TI Mall (Treasure Island)',
            city: 'Indore',
            state: 'Madhya Pradesh',
            country: 'India',
            postalCode: '452001',
            formattedAddress: 'Treasure Island Mall, MG Road, South Tukoganj, Indore, Madhya Pradesh 452001, India',
            address: 'Treasure Island Mall, MG Road, South Tukoganj, Indore',
            mainTitle: 'TI Mall',
            source: 'landmark_exact',
        };
    }

    // 3. 56 Dukan, New Palasia (lat: 22.7242, lng: 75.8829)
    const distTo56Dukan = Math.hypot(
        (lat - 22.7242) * 111320,
        (lng - 75.8829) * 111320 * 0.9224
    );
    if (distTo56Dukan <= 300) {
        return {
            latitude: lat,
            longitude: lng,
            area: '56 Dukan',
            city: 'Indore',
            state: 'Madhya Pradesh',
            country: 'India',
            postalCode: '452001',
            formattedAddress: '56 Dukan, New Palasia, Indore, Madhya Pradesh 452001, India',
            address: '56 Dukan, New Palasia, Indore',
            mainTitle: '56 Dukan',
            source: 'landmark_exact',
        };
    }

    // 4. Rajwada, Indore (lat: 22.7196, lng: 75.8577)
    const distToRajwada = Math.hypot(
        (lat - 22.7196) * 111320,
        (lng - 75.8577) * 111320 * 0.9224
    );
    if (distToRajwada <= 350) {
        return {
            latitude: lat,
            longitude: lng,
            area: 'Rajwada',
            city: 'Indore',
            state: 'Madhya Pradesh',
            country: 'India',
            postalCode: '452002',
            formattedAddress: 'Rajwada, MG Road, Indore, Madhya Pradesh 452002, India',
            address: 'Rajwada Palace, MG Road, Indore',
            mainTitle: 'Rajwada',
            source: 'landmark_exact',
        };
    }

    // 5. The Address Township, Near Vrindavan, Nipania, Indore (lat: 22.7585, lng: 75.9265)
    const distToAddressTownship = Math.hypot(
        (lat - 22.7585) * 111320,
        (lng - 75.9265) * 111320 * 0.9224
    );
    if (distToAddressTownship <= 500) {
        return {
            latitude: lat,
            longitude: lng,
            area: 'The Address Township',
            city: 'Indore',
            state: 'Madhya Pradesh',
            country: 'India',
            postalCode: '452010',
            formattedAddress: 'The Address Township, Near Vrindavan, Nipania, Indore, Madhya Pradesh 452010, India',
            address: 'The Address Township, Near Vrindavan, Nipania, Indore',
            mainTitle: 'The Address Township',
            source: 'landmark_exact',
        };
    }

    return null;
}

function fallbackCoords(lat, lng) {
    const isIndore = Math.abs(lat - 22.7175) < 0.6 && Math.abs(lng - 75.8717) < 0.6;
    const defaultCity = isIndore ? 'Indore' : '';
    const defaultState = isIndore ? 'Madhya Pradesh' : '';
    const defaultAddress = isIndore ? 'Indore, Madhya Pradesh, India' : (lat && lng ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'Indore, Madhya Pradesh, India');
    return {
        latitude: lat,
        longitude: lng,
        area: defaultCity,
        city: defaultCity,
        state: defaultState,
        country: 'India',
        postalCode: '',
        formattedAddress: defaultAddress,
        address: defaultAddress,
        source: 'coords_only',
    };
}

async function reverseGeocodeWithNominatim(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept-Language': 'en',
                'User-Agent': 'FoodSaathi-App/1.0 (contact@foodsaathi.in)'
            }
        });
        if (!res.ok) return null;
        const nom = await res.json();
        if (!nom || !nom.address) return null;

        const addr = nom.address;

        // 1. Determine City
        const rawCity = addr.city || addr.town || addr.municipality || addr.state_district || 'Indore';
        const city = cleanAdministrativeName(rawCity) || 'Indore';

        // 2. Determine Area / Locality: prioritize building, office, commercial, amenity, suburb, neighbourhood, road
        let rawArea = addr.building || addr.office || addr.commercial || addr.amenity || addr.shop ||
                      addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || '';
        if (!rawArea && addr.road) {
            rawArea = addr.road;
        }
        if (!rawArea && addr.city_district) {
            const cleanDistrict = cleanAdministrativeName(addr.city_district);
            if (cleanDistrict && cleanDistrict.toLowerCase() !== city.toLowerCase()) {
                rawArea = cleanDistrict;
            }
        }
        if (!rawArea && addr.county) {
            const cleanCounty = cleanAdministrativeName(addr.county);
            if (cleanCounty && cleanCounty.toLowerCase() !== city.toLowerCase()) {
                rawArea = cleanCounty;
            }
        }

        const area = cleanAdministrativeName(rawArea);
        const displayArea = area && area.toLowerCase() !== city.toLowerCase() ? area : city;
        const state = cleanAdministrativeName(addr.state || '') || 'Madhya Pradesh';
        const country = addr.country || 'India';
        const postalCode = addr.postcode || '';

        // Clean, non-repetitive address sequence
        const uniqueParts = [];
        if (displayArea && displayArea.toLowerCase() !== city.toLowerCase()) {
            uniqueParts.push(displayArea);
        }
        if (city) {
            uniqueParts.push(city);
        }
        if (state && state.toLowerCase() !== city.toLowerCase()) {
            uniqueParts.push(state);
        }
        if (postalCode) {
            uniqueParts.push(postalCode);
        }
        if (country && country.toLowerCase() !== state.toLowerCase()) {
            uniqueParts.push(country);
        }

        const formattedAddress = uniqueParts.join(', ');
        const address = displayArea && city && displayArea.toLowerCase() !== city.toLowerCase()
            ? `${displayArea}, ${city}`
            : formattedAddress;

        return {
            latitude: lat,
            longitude: lng,
            area: displayArea,
            city,
            state,
            country,
            postalCode,
            formattedAddress,
            address,
            source: 'nominatim',
        };
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

async function reverseGeocodeWithBigDataCloud(lat, lng) {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return null;
        const bdc = await res.json();

        // Extract more specific suburb/neighbourhood from localityInfo when available
        let specificArea = '';
        if (Array.isArray(bdc.localityInfo?.informative)) {
            const sub = bdc.localityInfo.informative.find(
                (item) => item.description?.includes('suburb') || item.description?.includes('neighbourhood') || item.description?.includes('residential') || (item.order && item.order <= 8)
            );
            if (sub?.name) {
                const cleaned = cleanAdministrativeName(sub.name);
                if (cleaned && cleaned.toLowerCase() !== cleanAdministrativeName(bdc.city || '').toLowerCase()) {
                    specificArea = cleaned;
                }
            }
        }
        if (!specificArea && Array.isArray(bdc.localityInfo?.administrative)) {
            const sub = bdc.localityInfo.administrative.find(
                (item) => item.adminLevel >= 6 && item.name && cleanAdministrativeName(item.name).toLowerCase() !== cleanAdministrativeName(bdc.city || '').toLowerCase()
            );
            if (sub?.name) {
                specificArea = cleanAdministrativeName(sub.name);
            }
        }

        const city = cleanAdministrativeName(bdc.city || bdc.locality || '') || 'Indore';
        let area = specificArea || (bdc.locality && cleanAdministrativeName(bdc.locality).toLowerCase() !== city.toLowerCase() ? cleanAdministrativeName(bdc.locality) : '');
        const state = cleanAdministrativeName(bdc.principalSubdivision || '') || 'Madhya Pradesh';
        const country = bdc.countryName || 'India';
        const postalCode = bdc.postcode || '';

        const displayArea = area && area.toLowerCase() !== city.toLowerCase() ? area : city;

        const uniqueParts = [];
        if (displayArea && displayArea.toLowerCase() !== city.toLowerCase()) uniqueParts.push(displayArea);
        if (city) uniqueParts.push(city);
        if (state && state.toLowerCase() !== city.toLowerCase()) uniqueParts.push(state);
        if (postalCode) uniqueParts.push(postalCode);
        if (country && country.toLowerCase() !== state.toLowerCase()) uniqueParts.push(country);

        const formattedAddress = uniqueParts.join(', ');
        return {
            latitude: lat,
            longitude: lng,
            area: displayArea,
            city,
            state,
            country,
            postalCode,
            formattedAddress,
            address: displayArea && city && displayArea.toLowerCase() !== city.toLowerCase() ? `${displayArea}, ${city}` : formattedAddress,
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

    // High accuracy exact landmark check (Corporate House, TI Mall, 56 Dukan, Rajwada, etc.)
    const landmark = resolveKnownLandmark(lat, lng);
    if (landmark) {
        return landmark;
    }

    const key = coordCacheKey(lat, lng);
    const cacheKey = key ? `geocode:rev:${key}` : null;

    try {
        const redis = getRedisClient();
        if (redis && cacheKey) {
            const cached = await redis.get(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                // Invalidate stale cache if it contains "Juni Indore" for Corporate House
                if (parsed.area === 'Juni Indore' && Math.abs(lat - 22.71755) < 0.01 && Math.abs(lng - 75.87178) < 0.01) {
                    await redis.del(cacheKey);
                } else {
                    return parsed;
                }
            }
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

    // Secondary fallback: OpenStreetMap Nominatim (high precision locality / neighborhood / road)
    if (!result) {
        try {
            result = await reverseGeocodeWithNominatim(lat, lng);
        } catch (err) {
            logger.warn(`Nominatim reverse geocode fallback failed: ${err.message}`);
        }
    }

    // Tertiary fallback: BigDataCloud
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

const INDORE_KNOWN_PLACES = [
    {
        keywords: ['the address', 'address township', 'vrindavan', 'the address township', 'the address, near vrinda', 'vrindavan township', 'shivalika the address', 'the address nipania'],
        name: 'The Address Township',
        display: 'The Address Township, Near Vrindavan, Nipania, Indore, Madhya Pradesh 452010',
        road: 'Near Vrindavan, Ring Road',
        locality: 'Nipania',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452010',
        lat: 22.7585,
        lng: 75.9265,
    },
    {
        keywords: ['corporate house', '169 rnt marg', 'rnt marg', 'corporate'],
        name: 'Corporate House',
        display: 'Corporate House, 169, RNT Marg, South Tukoganj, Indore, Madhya Pradesh 452001',
        road: '169, RNT Marg',
        locality: 'South Tukoganj',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452001',
        lat: 22.71755,
        lng: 75.87178,
    },
    {
        keywords: ['treasure island', 'ti mall', 'ti next', 'mg road ti'],
        name: 'Treasure Island (TI Mall)',
        display: 'Treasure Island Mall, 11, MG Road, South Tukoganj, Indore, Madhya Pradesh 452001',
        road: 'MG Road',
        locality: 'South Tukoganj',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452001',
        lat: 22.7208,
        lng: 75.8785,
    },
    {
        keywords: ['56 dukan', 'chhappan dukan', '56 shops', 'chappan dukan'],
        name: '56 Dukan',
        display: '56 Dukan, 56 Dukan Street, New Palasia, Indore, Madhya Pradesh 452001',
        road: '56 Dukan Street',
        locality: 'New Palasia',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452001',
        lat: 22.7242,
        lng: 75.8829,
    },
    {
        keywords: ['rajwada', 'rajwada palace', 'holkar palace'],
        name: 'Rajwada Palace',
        display: 'Rajwada Palace, MG Road, Rajwada, Indore, Madhya Pradesh 452002',
        road: 'MG Road',
        locality: 'Rajwada',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452002',
        lat: 22.7196,
        lng: 75.8577,
    },
    {
        keywords: ['vijay nagar', 'vijay nagar square', 'c21 mall', 'malhar mega mall'],
        name: 'Vijay Nagar',
        display: 'Vijay Nagar Square, AB Road, Vijay Nagar, Indore, Madhya Pradesh 452010',
        road: 'AB Road',
        locality: 'Vijay Nagar',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452010',
        lat: 22.7533,
        lng: 75.8937,
    },
    {
        keywords: ['bhawarkua', 'bhawarkuan', 'bhanwar kuwan', 'bhawarkua square'],
        name: 'Bhawarkua',
        display: 'Bhawarkua Square, AB Road, Indore, Madhya Pradesh 452001',
        road: 'AB Road',
        locality: 'Bhawarkua',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452001',
        lat: 22.6917,
        lng: 75.8667,
    },
    {
        keywords: ['palasia', 'new palasia', 'old palasia'],
        name: 'New Palasia',
        display: 'New Palasia, Indore, Madhya Pradesh 452001',
        road: 'Palasia Road',
        locality: 'New Palasia',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452001',
        lat: 22.7240,
        lng: 75.8830,
    },
    {
        keywords: ['phoenix citadel', 'phoenix mall', 'citadel mall'],
        name: 'Phoenix Citadel Mall',
        display: 'Phoenix Citadel Mall, MR 10 Junction, Bypass Road, Indore, Madhya Pradesh 452016',
        road: 'MR 10 / Bypass Road',
        locality: 'Bypass Road',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452016',
        lat: 22.7845,
        lng: 75.9180,
    },
    {
        keywords: ['mahalaxmi nagar', 'bombay hospital'],
        name: 'Mahalaxmi Nagar',
        display: 'Mahalaxmi Nagar, Near Bombay Hospital, Ring Road, Indore, Madhya Pradesh 452010',
        road: 'Ring Road',
        locality: 'Mahalaxmi Nagar',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452010',
        lat: 22.7650,
        lng: 75.9000,
    },
    {
        keywords: ['geeta bhawan', 'geeta bhavan', 'manorama ganj'],
        name: 'Geeta Bhavan',
        display: 'Geeta Bhavan Square, AB Road, Indore, Madhya Pradesh 452001',
        road: 'AB Road',
        locality: 'Geeta Bhavan',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452001',
        lat: 22.7190,
        lng: 75.8850,
    },
    {
        keywords: ['bicholi mardana', 'bicholi', 'bypass road'],
        name: 'Bicholi Mardana',
        display: 'Bicholi Mardana, Bypass Road, Indore, Madhya Pradesh 452016',
        road: 'Bypass Road',
        locality: 'Bicholi Mardana',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452016',
        lat: 22.7050,
        lng: 75.9200,
    },
    {
        keywords: ['nipania', 'nipanya'],
        name: 'Nipania',
        display: 'Nipania, Near Bypass Road, Indore, Madhya Pradesh 452010',
        road: 'Nipania Main Road',
        locality: 'Nipania',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452010',
        lat: 22.7680,
        lng: 75.9150,
    },
    {
        keywords: ['railway station', 'indore junction', 'chhoti gwaltoli'],
        name: 'Indore Junction Railway Station',
        display: 'Indore Junction Railway Station, Chhoti Gwaltoli, Indore, Madhya Pradesh 452001',
        road: 'Station Road',
        locality: 'Chhoti Gwaltoli',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452001',
        lat: 22.7180,
        lng: 75.8670,
    }
];

export async function searchLocations(rawQuery = '', refLat = 22.7196, refLng = 75.8577) {
    const q = String(rawQuery || '').trim();
    if (!q || q.length < 2) return [];

    const lowerQ = q.toLowerCase();
    const tokens = lowerQ.split(/[\s,]+/).filter((t) => t.length > 1 && !['near', 'at', 'in', 'the'].includes(t));
    const results = [];
    const seenNames = new Set();

    // 1. Match local curated places
    for (const place of INDORE_KNOWN_PLACES) {
        const matchesAnyKeyword = place.keywords.some((kw) => lowerQ.includes(kw) || kw.includes(lowerQ));
        const matchesToken = tokens.length > 0 && tokens.every((tok) =>
            place.display.toLowerCase().includes(tok) ||
            place.keywords.some((kw) => kw.includes(tok))
        );

        if (matchesAnyKeyword || matchesToken) {
            results.push({
                id: `local_${place.name.toLowerCase().replace(/\s+/g, '_')}`,
                display: place.display,
                lat: place.lat,
                lng: place.lng,
                address: {
                    road: place.road,
                    suburb: place.locality,
                    city: place.city,
                    state: place.state,
                    postcode: place.pincode,
                    country: 'India',
                },
                source: 'curated'
            });
            seenNames.add(place.display.toLowerCase());
        }
    }

    // 2. Google Places / Geocode (if API key available)
    const apiKey = config.googleMapsApiKey;
    if (apiKey) {
        try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q + ', Indore, Madhya Pradesh, India')}&key=${apiKey}`;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4000);
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);
            const data = await res.json();
            if (data.status === 'OK' && Array.isArray(data.results)) {
                for (const r of data.results.slice(0, 5)) {
                    const loc = r.geometry?.location;
                    if (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) {
                        const disp = r.formatted_address;
                        if (!seenNames.has(disp.toLowerCase())) {
                            seenNames.add(disp.toLowerCase());
                            results.push({
                                id: r.place_id || `google_${loc.lat}_${loc.lng}`,
                                display: disp,
                                lat: loc.lat,
                                lng: loc.lng,
                                address: {
                                    road: r.formatted_address.split(',')[0] || '',
                                    city: 'Indore',
                                    state: 'Madhya Pradesh',
                                    country: 'India',
                                },
                                source: 'google'
                            });
                        }
                    }
                }
            }
        } catch (err) {
            logger.warn(`Google geocode search failed: ${err.message}`);
        }
    }

    // 3. Fallback to OpenStreetMap Nominatim with proper User-Agent from backend
    if (results.length < 5) {
        try {
            const searchTerms = [q, `${q}, Indore`];
            for (const term of searchTerms) {
                if (results.length >= 5) break;
                const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=in&q=${encodeURIComponent(term)}`;
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 4000);
                const res = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        'Accept-Language': 'en',
                        'User-Agent': 'FoodSaathi-App/1.0 (contact@foodsaathi.in)'
                    }
                });
                clearTimeout(timeout);
                if (res.ok) {
                    const json = await res.json();
                    if (Array.isArray(json)) {
                        for (const item of json) {
                            const lat = Number(item.lat);
                            const lng = Number(item.lon);
                            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                                const rawDisplay = item.display_name || '';
                                const cleanedDisplay = rawDisplay
                                    .split(',')
                                    .map(part => cleanAdministrativeName(part.trim()))
                                    .filter(Boolean)
                                    .join(', ');

                                if (!seenNames.has(cleanedDisplay.toLowerCase()) && cleanedDisplay.length > 5) {
                                    seenNames.add(cleanedDisplay.toLowerCase());
                                    results.push({
                                        id: item.place_id || `nom_${lat}_${lng}`,
                                        display: cleanedDisplay,
                                        lat,
                                        lng,
                                        address: item.address || {},
                                        source: 'nominatim'
                                    });
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) {
            logger.warn(`Nominatim search failed: ${err.message}`);
        }
    }

    return results.slice(0, 6);
}
