import { getOutletTimingsForRestaurant } from './outletTimings.service.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const toMinutes = (value) => {
    const m = String(value || '').trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h > 23 || min > 59) return null;
    return h * 60 + min;
};

/** Day name and minutes-since-midnight in the server's configured timezone (TZ). */
function localClock(now) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: process.env.TZ || undefined,
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(now);
    const get = (type) => parts.find((p) => p.type === type)?.value;
    return {
        dayIndex: DAY_NAMES.indexOf(get('weekday')),
        minutes: Number(get('hour')) * 60 + Number(get('minute')),
    };
}

/**
 * Same rule as the customer app (Frontend utils/restaurantAvailability.js): a window that
 * closes after midnight (e.g. 08:00-01:30) also covers the early hours of the next day.
 * @param {Record<string, {isOpen: boolean, openingTime: string, closingTime: string}>} timings
 */
export function isWithinOutletHours(timings, now = new Date()) {
    if (!timings || typeof timings !== 'object') return true;
    const { dayIndex, minutes } = localClock(now);
    if (dayIndex < 0) return true;
    const today = timings[DAY_NAMES[dayIndex]];
    const yesterday = timings[DAY_NAMES[(dayIndex + 6) % 7]];

    if (yesterday && yesterday.isOpen !== false) {
        const open = toMinutes(yesterday.openingTime);
        const close = toMinutes(yesterday.closingTime);
        if (open !== null && close !== null && close < open && minutes <= close) return true;
    }

    if (!today) return true;
    if (today.isOpen === false) return false;
    const open = toMinutes(today.openingTime);
    const close = toMinutes(today.closingTime);
    if (open === null || close === null || open === close) return true;
    return close > open ? minutes >= open && minutes <= close : minutes >= open;
}

export async function isRestaurantWithinOutletHours(restaurantId, now = new Date()) {
    const { outletTimings } = await getOutletTimingsForRestaurant(restaurantId);
    return isWithinOutletHours(outletTimings, now);
}
