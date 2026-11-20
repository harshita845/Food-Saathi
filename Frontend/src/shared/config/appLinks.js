/**
 * Official Google Play Store links for Food Saathi apps
 */
export const PLAYSTORE_URLS = {
  user: "https://play.google.com/store/apps/details?id=com.foodsaathi.user&hl=en",
  delivery: "https://play.google.com/store/apps/details?id=com.foodsaathi.delivery&hl=en",
  restaurant: "https://play.google.com/store/apps/details?id=com.foodsaathi.restaurent&hl=en",
};

export const USER_APP_PLAYSTORE_URL = PLAYSTORE_URLS.user;
export const DELIVERY_APP_PLAYSTORE_URL = PLAYSTORE_URLS.delivery;
export const RESTAURANT_APP_PLAYSTORE_URL = PLAYSTORE_URLS.restaurant;

/**
 * Returns user app link with optional referrer
 */
export function getUserReferralLink(refId = "") {
  const base = PLAYSTORE_URLS.user;
  const cleanId = String(refId || "").trim();
  if (!cleanId) return base;
  return `${base}&referrer=${encodeURIComponent(cleanId)}`;
}

/**
 * Returns delivery partner app link with optional referrer
 */
export function getDeliveryReferralLink(refId = "") {
  const base = PLAYSTORE_URLS.delivery;
  const cleanId = String(refId || "").trim();
  if (!cleanId) return base;
  return `${base}&referrer=${encodeURIComponent(cleanId)}`;
}

/**
 * Returns restaurant partner app link with optional referrer
 */
export function getRestaurantReferralLink(refId = "") {
  const base = PLAYSTORE_URLS.restaurant;
  const cleanId = String(refId || "").trim();
  if (!cleanId) return base;
  return `${base}&referrer=${encodeURIComponent(cleanId)}`;
}

