import { sendResponse } from '../../../../utils/response.js';
import { reverseGeocode } from '../../../../services/geocoding.service.js';
import { computeTrackingLegs } from '../../../../services/trackingDistance.service.js';
import { logger } from '../../../../utils/logger.js';

export const reverseGeocodePublicController = async (req, res, next) => {
    try {
        const lat = Number(req.query.lat);
        const lng = Number(req.query.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return sendResponse(res, 400, 'Valid latitude and longitude are required');
        }

        const result = await reverseGeocode(lat, lng);
        return sendResponse(res, 200, 'Address resolved', {
            results: [
                {
                    formatted_address: result.formattedAddress,
                    address_components: {
                        area: result.area,
                        city: result.city,
                        state: result.state,
                        country: result.country,
                        postal_code: result.postalCode,
                    },
                },
            ],
            location: result,
        });
    } catch (error) {
        logger.error(`reverseGeocodePublicController unexpected error: ${error?.message || error}`);
        const lat = Number(req.query.lat) || 0;
        const lng = Number(req.query.lng) || 0;
        const fallback = {
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
        return sendResponse(res, 200, 'Address resolved', {
            results: [
                {
                    formatted_address: fallback.formattedAddress,
                    address_components: {
                        area: fallback.area,
                        city: fallback.city,
                        state: fallback.state,
                        country: fallback.country,
                        postal_code: fallback.postalCode,
                    },
                },
            ],
            location: fallback,
        });
    }
};

export const computeDistancePublicController = async (req, res, next) => {
    try {
        const { rider, restaurant, customer } = req.body ?? {};
        const legs = await computeTrackingLegs({ rider, restaurant, customer });
        return sendResponse(res, 200, 'Distances computed', { legs });
    } catch (error) {
        next(error);
    }
};
