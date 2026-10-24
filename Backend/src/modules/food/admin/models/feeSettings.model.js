import mongoose from 'mongoose';

const deliveryFeeRangeSchema = new mongoose.Schema(
    {
        min: { type: Number, required: true, min: 0 },
        max: { type: Number, required: true, min: 0 },
        fee: { type: Number, required: true, min: 0 }
    },
    { _id: false }
);

const feeSettingsSchema = new mongoose.Schema(
    {
        // No defaults here; admin must explicitly configure values.
        deliveryFee: { type: Number, min: 0 },
        deliveryFeeRanges: { type: [deliveryFeeRangeSchema], default: [] },
        freeDeliveryUpTo: { type: Number, min: 0 },
        freeDeliveryThreshold: { type: Number, min: 0 },
        platformFee: { type: Number, min: 0 },
        packagingFee: { type: Number, min: 0 },
        gstRate: { type: Number, min: 0, max: 100 },
        gstOnDeliveryFee: { type: Number, min: 0, max: 100, default: 0 },
        gstOnPlatformFee: { type: Number, min: 0, max: 100, default: 0 },
        gstOnPackagingFee: { type: Number, min: 0, max: 100, default: 0 },
        deliveryBonusAmount: { type: Number, min: 0, default: 0 },
        dispatchRadiusExpansionEnabled: { type: Boolean, default: true },
        dispatchRadiusTiers: { type: [Number], default: [2, 4, 6, 8, 15] },
        /** How long a broadcast offer stays open before dispatch widens the radius. */
        dispatchOfferTimeoutSeconds: { type: Number, min: 15, max: 600, default: 60 },
        /** Scheduled orders start the rider search this many minutes before the scheduled time. */
        scheduledDispatchLeadMinutes: { type: Number, min: 0, max: 240, default: 30 },
        globalRestaurantCommission: { type: Number, min: 0, default: 0 },
        globalGstOnItem: { type: Number, min: 0, max: 100, default: 0 },
        globalGstOnCommission: { type: Number, min: 0, max: 100, default: 18 },
        globalPaymentGatewayFee: { type: Number, min: 0, max: 100, default: 2 },
        globalTcs: { type: Number, min: 0, max: 100, default: 1 },
        applyGlobalTaxes: { type: Boolean, default: true },
        isActive: { type: Boolean, default: true, index: true }
    },
    { collection: 'payment_fee_settings', timestamps: true }
);

feeSettingsSchema.index({ isActive: 1, createdAt: -1 });

export const FoodFeeSettings = mongoose.model('FoodFeeSettings', feeSettingsSchema);


