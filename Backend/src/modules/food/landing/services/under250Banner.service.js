import { FoodUnder250Banner } from '../models/under250Banner.model.js';
import { uploadBannerImage } from '../../../../services/upload.service.js';

export const listUnder250Banners = async () => {
    const docs = await FoodUnder250Banner.find().sort({ sortOrder: 1, createdAt: 1 }).lean();
    return docs.map(b => ({
        ...b,
        order: b.sortOrder ?? 0
    }));
};

export const createUnder250BannersFromFiles = async (files, meta = {}) => {
    if (!files || !files.length) {
        return [];
    }

    const results = [];

    for (const file of files) {
        try {
            const imageUrl = await uploadBannerImage(file.buffer);

            const banner = await FoodUnder250Banner.create({
                imageUrl: imageUrl,
                publicId: null,
                title: meta.title,
                ctaText: meta.ctaText,
                ctaLink: meta.ctaLink,
                zoneId: meta.zoneId,
                sortOrder: meta.sortOrder ?? 0,
                isActive: true,
            });

            const obj = banner.toObject();
            results.push({ success: true, banner: { ...obj, order: obj.sortOrder ?? 0 } });
        } catch (error) {
            results.push({ success: false, error: error.message });
        }
    }

    return results;
};

export const deleteUnder250Banner = async (id) => {
    const doc = await FoodUnder250Banner.findById(id);
    if (!doc) {
        return { deleted: false };
    }

    if (doc.publicId) {
        // legacy
    }

    await doc.deleteOne();
    return { deleted: true };
};

export const updateUnder250BannerOrder = async (id, sortOrder) => {
    const updated = await FoodUnder250Banner.findByIdAndUpdate(
        id,
        { sortOrder },
        { new: true }
    ).lean();
    return updated ? { ...updated, order: updated.sortOrder ?? 0 } : null;
};

export const toggleUnder250BannerStatus = async (id, isActive) => {
    const updated = await FoodUnder250Banner.findByIdAndUpdate(
        id,
        { isActive },
        { new: true }
    ).lean();
    return updated ? { ...updated, order: updated.sortOrder ?? 0 } : null;
};

