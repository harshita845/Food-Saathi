import mongoose from 'mongoose';
import { FoodDeliveryPartner } from '../models/deliveryPartner.model.js';
import { DeliveryLocationLog } from '../models/deliveryLocationLog.model.js';
import { FoodOrder } from '../../orders/models/order.model.js';
import { getRedisClient } from '../../../../config/redis.js';
import { getFirebaseDB } from '../../../../config/firebase.js';
import { getIO, rooms } from '../../../../config/socket.js';
import { logger } from '../../../../utils/logger.js';
import { ACTIVE_DELIVERY_ORDER_STATUSES } from './deliveryMultiOrderSettings.service.js';

/**
 * Normalizes and processes batched driver GPS coordinates.
 * Supports batch payloads, deduplication, historical logs, live state broadcast,
 * and returns dynamic tracking configuration for the Flutter client.
 */
export const processDriverLocationBatch = async (deliveryPartnerId, payload = {}) => {
    const startTime = Date.now();
    console.log(`\n==================== 🛵 DRIVER LOCATION RECEIVED 🛵 ====================`);
    console.log(`⏱️ Time: ${new Date().toLocaleTimeString()} | Driver: ${deliveryPartnerId}`);

    if (!deliveryPartnerId) {
        console.error(`❌ [LOCATION_TRACKING] Missing deliveryPartnerId`);
        throw new Error('Delivery partner ID is required');
    }

    const partnerObjectId = new mongoose.Types.ObjectId(deliveryPartnerId);

    // 1. Normalize locations array (supports both single object and batch array)
    let rawLocations = [];
    if (Array.isArray(payload.locations)) {
        rawLocations = payload.locations;
    } else if (Array.isArray(payload)) {
        rawLocations = payload;
    } else if (payload.lat != null && payload.lng != null) {
        rawLocations = [payload];
    } else if (payload.locations && typeof payload.locations === 'object') {
        rawLocations = [payload.locations];
    }

    console.log(`📦 Coordinates count: ${rawLocations.length} points`);

    // 2. Fetch driver profile & active order in parallel
    // A rider can carry several orders at once (multi-order): every accepted, unfinished order gets the location.
    const [partner, activeOrders] = await Promise.all([
        FoodDeliveryPartner.findById(deliveryPartnerId).select('status availabilityStatus lastLocationAt name phone').lean(),
        FoodOrder.find({
            'dispatch.deliveryPartnerId': partnerObjectId,
            'dispatch.status': 'accepted',
            orderStatus: { $in: ACTIVE_DELIVERY_ORDER_STATUSES }
        }).select('_id order_id orderStatus userId restaurantId').sort({ 'dispatch.acceptedAt': 1 }).lean()
    ]);
    const activeOrder = activeOrders[0] || null;

    if (!partner) {
        console.error(`❌ [LOCATION_TRACKING] Driver not found: ${deliveryPartnerId}`);
        throw new Error('Delivery partner not found');
    }

    if (activeOrder) {
        console.log(`🚀 Active Orders: ${activeOrders.map((o) => `${o.order_id || o._id}(${o.orderStatus})`).join(', ')}`);
    } else {
        console.log(`ℹ️ State: Online / Idle (No active trip)`);
    }

    // 3. Filter & validate incoming coordinates
    const validPoints = [];
    for (const item of rawLocations) {
        const lat = Number(item.lat ?? item.latitude);
        const lng = Number(item.lng ?? item.longitude);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;

        // Parse capturedAt timestamp
        let capturedAt = item.capturedAt ? new Date(item.capturedAt) : new Date();
        if (isNaN(capturedAt.getTime())) {
            capturedAt = new Date();
        }

        const pointOrderId = item.orderId 
            ? (mongoose.Types.ObjectId.isValid(item.orderId) ? new mongoose.Types.ObjectId(item.orderId) : null)
            : (activeOrder?._id || null);

        validPoints.push({
            deliveryPartnerId: partnerObjectId,
            orderId: pointOrderId,
            location: {
                type: 'Point',
                coordinates: [lng, lat]
            },
            lat,
            lng,
            speed: item.speed != null ? Number(item.speed) : null,
            heading: item.heading != null ? Number(item.heading) : (item.bearing != null ? Number(item.bearing) : null),
            accuracy: item.accuracy != null ? Number(item.accuracy) : null,
            altitude: item.altitude != null ? Number(item.altitude) : null,
            battery: item.battery != null ? Number(item.battery) : null,
            capturedAt
        });
    }

    // Sort valid points chronologically (oldest to newest)
    validPoints.sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());

    let processedCount = 0;

    if (validPoints.length > 0) {
        // 4. Bulk Upsert Breadcrumbs to MongoDB (Deduplicated on deliveryPartnerId + capturedAt)
        try {
            const bulkOps = validPoints.map(pt => ({
                updateOne: {
                    filter: {
                        deliveryPartnerId: pt.deliveryPartnerId,
                        capturedAt: pt.capturedAt
                    },
                    update: {
                        $setOnInsert: {
                            deliveryPartnerId: pt.deliveryPartnerId,
                            orderId: pt.orderId,
                            location: pt.location,
                            speed: pt.speed,
                            heading: pt.heading,
                            accuracy: pt.accuracy,
                            altitude: pt.altitude,
                            battery: pt.battery,
                            capturedAt: pt.capturedAt
                        }
                    },
                    upsert: true
                }
            }));

            const bulkRes = await DeliveryLocationLog.bulkWrite(bulkOps, { ordered: false });
            processedCount = (bulkRes.upsertedCount || 0) + (bulkRes.modifiedCount || 0) + (bulkRes.matchedCount || 0);
            logger.info(`💾 [LOCATION_TRACKING] Logged ${validPoints.length} points to DB breadcrumb history`);
        } catch (dbErr) {
            logger.warn(`⚠️ [LOCATION_TRACKING] Non-critical bulk log insert notice: ${dbErr.message}`);
            processedCount = validPoints.length;
        }

        // 5. Identify the newest point in the batch
        const newestPoint = validPoints[validPoints.length - 1];
        const lastKnownTime = partner.lastLocationAt ? new Date(partner.lastLocationAt).getTime() : 0;
        const isNewest = newestPoint.capturedAt.getTime() >= lastKnownTime;

        console.log(`📍 GPS Coordinates: Lat=${newestPoint.lat}, Lng=${newestPoint.lng} | Heading=${newestPoint.heading}° | Speed=${newestPoint.speed}km/h`);

        if (isNewest) {
            const now = newestPoint.capturedAt.getTime();
            const coordPayload = {
                lat: newestPoint.lat,
                lng: newestPoint.lng,
                speed: newestPoint.speed || 0,
                heading: newestPoint.heading || 0,
                accuracy: newestPoint.accuracy,
                timestamp: now
            };

            // A. Update MongoDB Driver Location
            FoodDeliveryPartner.findByIdAndUpdate(deliveryPartnerId, {
                $set: {
                    lastLat: newestPoint.lat,
                    lastLng: newestPoint.lng,
                    lastLocation: newestPoint.location,
                    lastLocationAt: newestPoint.capturedAt
                }
            }).catch(e => logger.error(`❌ [LOCATION_TRACKING] Mongo driver location update error: ${e.message}`));

            if (activeOrders.length) {
                FoodOrder.updateMany(
                    { _id: { $in: activeOrders.map((o) => o._id) } },
                    { $set: { lastRiderLocation: newestPoint.location } }
                ).catch(e => logger.error(`❌ [LOCATION_TRACKING] Mongo order location update error: ${e.message}`));
            }

            // B. Update Redis Hot Cache
            try {
                const redis = getRedisClient();
                if (redis) {
                    const coordString = JSON.stringify(coordPayload);
                    const redisOps = [
                        redis.hSet('rider:locations:hot', String(deliveryPartnerId), coordString)
                    ];
                    for (const o of activeOrders) {
                        redisOps.push(redis.hSet('order:locations:hot', String(o._id), coordString));
                    }
                    await Promise.all(redisOps);
                    logger.info(`🔥 [LOCATION_TRACKING] Redis hot cache updated for driver: ${deliveryPartnerId}`);
                }
            } catch (rErr) {
                logger.warn(`⚠️ [LOCATION_TRACKING] Redis hot cache error: ${rErr.message}`);
            }

            // C. Update Firebase Realtime Database
            try {
                const firebaseDB = getFirebaseDB();
                if (firebaseDB) {
                    // Update delivery boy node
                    const boyRef = firebaseDB.ref(`delivery_boys/${deliveryPartnerId}`);
                    boyRef.update({
                        lat: newestPoint.lat,
                        lng: newestPoint.lng,
                        heading: newestPoint.heading || 0,
                        speed: newestPoint.speed || 0,
                        accuracy: newestPoint.accuracy || 0,
                        last_updated: now,
                        is_online: partner.availabilityStatus === 'online',
                        active_order_id: activeOrder ? String(activeOrder._id) : null,
                        active_order_ids: activeOrders.map((o) => String(o._id))
                    }).then(() => {
                        logger.info(`🔥 [FIREBASE] Updated node delivery_boys/${deliveryPartnerId}`);
                    }).catch(e => logger.warn(`⚠️ [FIREBASE] delivery_boys error: ${e.message}`));

                    // Update the tracking node of every order on this trip
                    for (const o of activeOrders) {
                        const orderKeys = [String(o._id)];
                        if (o.order_id && String(o.order_id) !== String(o._id)) {
                            orderKeys.push(String(o.order_id));
                        }

                        for (const key of orderKeys) {
                            const orderRef = firebaseDB.ref(`active_orders/${key}`);
                            orderRef.update({
                                lat: newestPoint.lat,
                                lng: newestPoint.lng,
                                heading: newestPoint.heading || 0,
                                speed: newestPoint.speed || 0,
                                accuracy: newestPoint.accuracy || 0,
                                last_updated: now,
                                status: o.orderStatus || 'on_the_way'
                            }).catch(e => logger.warn(`⚠️ [FIREBASE] active_orders error: ${e.message}`));
                        }
                    }
                }
            } catch (fErr) {
                logger.warn(`⚠️ [LOCATION_TRACKING] Firebase sync error: ${fErr.message}`);
            }

            // D. Broadcast via Socket.IO to every order's tracking, customer and restaurant rooms
            try {
                const io = getIO();
                for (const o of activeOrders) {
                    const orderMongoId = String(o._id);
                    const trackingBroadcast = {
                        orderId: orderMongoId,
                        order_id: orderMongoId,
                        customOrderId: o.order_id || null,
                        trackingId: orderMongoId,
                        deliveryPartnerId: String(deliveryPartnerId),
                        driverId: String(deliveryPartnerId),
                        ...coordPayload,
                        status: o.orderStatus || 'on_the_way'
                    };
                    let target = io.to(rooms.tracking(orderMongoId));
                    if (o.order_id && o.order_id !== orderMongoId) target = target.to(rooms.tracking(o.order_id));
                    if (o.userId) target = target.to(rooms.user(String(o.userId)));
                    if (o.restaurantId) target = target.to(rooms.restaurant(String(o.restaurantId)));
                    target.emit('location-update', trackingBroadcast);
                }
            } catch (sErr) {
                logger.error(`❌ [LOCATION_TRACKING] Socket emit error: ${sErr.message}`);
            }
        }
    }

    // 6. Compute Dynamic Configuration for Flutter Driver App
    const isApproved = partner.status === 'approved';
    const isOnline = partner.availabilityStatus === 'online';
    const hasActiveTrip = Boolean(activeOrder);

    let mode = 'idle';
    let stopTracking = false;
    let intervalMs = 10000;
    let distanceFilterMeters = 30;

    if (!isApproved || (!isOnline && !hasActiveTrip)) {
        stopTracking = true;
        mode = 'offline';
        intervalMs = 30000;
        distanceFilterMeters = 100;
    } else if (hasActiveTrip) {
        mode = 'onTrip';
        stopTracking = false;
        intervalMs = 10000; // 10s cadence on active trip
        distanceFilterMeters = 20; // 20m filter
    } else {
        mode = 'idle';
        stopTracking = false;
        intervalMs = 20000; // 20s cadence when idle online
        distanceFilterMeters = 50; // 50m filter
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Processed in ${duration}ms | Mode: ${mode} | stopTracking: ${stopTracking}`);
    console.log(`=========================================================================\n`);

    return {
        processedCount: validPoints.length,
        totalReceived: rawLocations.length,
        activeOrderId: activeOrder ? String(activeOrder._id) : null,
        activeOrderIds: activeOrders.map((o) => String(o._id)),
        config: {
            stopTracking,
            mode,
            intervalMs,
            distanceFilterMeters
        }
    };
};
