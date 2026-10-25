/**
 * Serve every Cloudinary image in GET API responses through Cloudinary's on-the-fly optimizer:
 * modern format (WebP/AVIF), automatic quality, and a width cap. Stored URLs are untouched;
 * only the JSON sent to the apps is rewritten. Already-transformed URLs, PDFs, SVGs and
 * GIFs are left as they are.
 */
const CLOUDINARY_IMAGE_URL = /https:\/\/res\.cloudinary\.com\/[^/"\s]+\/image\/upload\/[^"\s\\]+/g;
const TRANSFORM = 'f_auto,q_auto,c_limit,w_1200';
const SKIP_EXTENSIONS = /\.(pdf|svg|gif)(\?|$)/i;

export function optimizeCloudinaryUrl(url) {
    if (typeof url !== 'string' || SKIP_EXTENSIONS.test(url)) return url;
    const marker = '/image/upload/';
    const idx = url.indexOf(marker);
    if (idx === -1) return url;
    const rest = url.slice(idx + marker.length);
    const firstSegment = rest.split('/')[0];
    // Already has a transformation (e.g. "w_300,c_fill" or "f_auto")
    if (/^[a-z]{1,3}_[^/]*$/.test(firstSegment) && !/^v\d+$/.test(firstSegment)) return url;
    return `${url.slice(0, idx + marker.length)}${TRANSFORM}/${rest}`;
}

export const optimizeImageUrls = (req, res, next) => {
    if (req.method !== 'GET') return next();
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        let serialized;
        try {
            serialized = JSON.stringify(body);
        } catch {
            return originalJson(body);
        }
        if (!serialized || !serialized.includes('res.cloudinary.com')) {
            return originalJson(body);
        }
        const rewritten = serialized.replace(CLOUDINARY_IMAGE_URL, optimizeCloudinaryUrl);
        if (!res.get('Content-Type')) res.set('Content-Type', 'application/json; charset=utf-8');
        return res.send(rewritten);
    };
    next();
};
