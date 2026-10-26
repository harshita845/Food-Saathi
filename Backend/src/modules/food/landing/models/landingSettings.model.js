import mongoose from 'mongoose';

const foodLandingSettingsSchema = new mongoose.Schema(
    {
        exploreMoreHeading: {
            type: String,
            default: 'Explore more'
        },
        recommendedRestaurantIds: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'FoodRestaurant',
            default: []
        },
        showHeroBanners: {
            type: Boolean,
            default: true
        },
        showUnder250: {
            type: Boolean,
            default: true
        },
        showDining: {
            type: Boolean,
            default: true
        },
        showExploreIcons: {
            type: Boolean,
            default: true
        },
        showTop10: {
            type: Boolean,
            default: true
        },
        showGourmet: {
            type: Boolean,
            default: true
        },
        under250PriceLimit: {
            type: Number,
            default: 250,
            min: 1,
            max: 10000
        },
        festBannerImages: {
            type: [String],
            default: []
        },
        festBanner: {
            enabled: { type: Boolean, default: true },
            missionText: { type: String, default: 'Food Saathi Missions' },
            title: { type: String, default: 'FEAST BONANZA' },
            vegTitle: { type: String, default: 'VEGGIE DELIGHT' },
            badgeText: { type: String, default: 'UPTO 60% OFF NOW' },
            vegBadgeText: { type: String, default: 'PURE VEG MAGIC' },
            nonVegImages: {
                type: [String],
                default: [
                    "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&h=500&fit=crop",
                    "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&h=500&fit=crop",
                    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=500&fit=crop",
                    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&h=500&fit=crop",
                    "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500&h=500&fit=crop"
                ]
            },
            vegImages: {
                type: [String],
                default: [
                    "https://images.unsplash.com/photo-1585238341267-1cfec2046a55?w=500&h=500&fit=crop",
                    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=500&fit=crop",
                    "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&h=500&fit=crop",
                    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=500&fit=crop",
                    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop"
                ]
            }
        },
        stats: {
            restaurants: { type: String, default: '3,00,000+' },
            cities: { type: String, default: '800+' },
            orders: { type: String, default: '3 billion+' }
        },
        appLinks: {
            playStore: { type: String, default: 'https://play.google.com/store/apps/details?id=com.foodsaathi.user' },
            appStore: { type: String, default: '' }
        },
        socialLinks: {
            instagram: { type: String, default: '' },
            twitter: { type: String, default: '' },
            facebook: { type: String, default: '' },
            linkedin: { type: String, default: '' },
            youtube: { type: String, default: '' }
        },
        footerLinks: {
            about: {
                type: Array, default: [
                    { label: 'Who We Are', url: '#' },
                    { label: 'Blog', url: '#' },
                    { label: 'Work With Us', url: '#' },
                    { label: 'Investor Relations', url: '#' },
                    { label: 'Report Fraud', url: '#' }
                ]
            },
            forRestaurants: {
                type: Array, default: [
                    { label: 'Partner With Us', url: '#' },
                    { label: 'Apps For You', url: '#' }
                ]
            },
            learnMore: {
                type: Array, default: [
                    { label: 'Privacy', url: '#' },
                    { label: 'Security', url: '#' },
                    { label: 'Terms', url: '#' },
                    { label: 'Sitemap', url: '#' }
                ]
            }
        },
        copyrightText: {
            type: String,
            default: '© 2026 Food Saathi™ All rights reserved.'
        },
        heroSlides: {
            type: Array,
            default: [
                {
                    id: 1,
                    type: 'image',
                    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2070&auto=format&fit=crop",
                    title: "Master Chef",
                    subtitle: "Experience the art of fine dining"
                },
                {
                    id: 2,
                    type: 'image',
                    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop",
                    title: "Exquisite Taste",
                    subtitle: "High-class Professional Service"
                },
                {
                    id: 3,
                    type: 'image',
                    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop",
                    title: "Tradition & Passion",
                    subtitle: "Only the best ingredients for our dishes"
                }
            ]
        }
    },
    {
        collection: 'food_landing_settings',
        timestamps: true
    }
);

export const FoodLandingSettings = mongoose.model('FoodLandingSettings', foodLandingSettingsSchema);

