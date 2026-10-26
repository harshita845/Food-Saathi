import { FoodLandingSettings } from '../models/landingSettings.model.js';

export const getLandingSettings = async () => {
    let doc = await FoodLandingSettings.findOne().lean();
    if (!doc) {
        doc = (await FoodLandingSettings.create({})).toObject();
    }
    if (!doc.festBanner) {
        doc.festBanner = {
            enabled: true,
            missionText: 'Food Saathi Missions',
            title: 'FEAST BONANZA',
            vegTitle: 'VEGGIE DELIGHT',
            badgeText: 'UPTO 60% OFF NOW',
            vegBadgeText: 'PURE VEG MAGIC',
            nonVegImages: [
                "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&h=500&fit=crop",
                "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&h=500&fit=crop",
                "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=500&fit=crop",
                "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&h=500&fit=crop",
                "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500&h=500&fit=crop"
            ],
            vegImages: [
                "https://images.unsplash.com/photo-1585238341267-1cfec2046a55?w=500&h=500&fit=crop",
                "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=500&fit=crop",
                "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&h=500&fit=crop",
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=500&fit=crop",
                "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop"
            ]
        };
    }
    return doc;
};

export const updateLandingSettings = async (payload) => {
    const doc = await FoodLandingSettings.findOneAndUpdate({}, payload, {
        new: true,
        upsert: true
    }).lean();
    return doc;
};

