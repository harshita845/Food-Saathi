/**
 * Script: Create Lalabigha - Ajnaura Zone and add 2 Restaurants & 2 Delivery Boys
 * Location: Vill Lalabigha, Post Office Ajnaura, City Biharsharif (Nalanda, Bihar)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_ENV === 'production'
    ? process.env.MONGO_URI_PRODUCTION
    : process.env.MONGO_URI_LOCAL;

async function run() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB successfully!');
        const db = mongoose.connection.db;

        // ========================================================
        // 1. CREATE OR UPDATE ZONE
        // ========================================================
        const zoneName = 'Lalabigha - Ajnaura';
        const serviceLocation = 'Vill Lalabigha, PO Ajnaura, Biharsharif';
        const centerLat = 25.2149;
        const centerLng = 85.3963;

        // Polygon bounding Lalabigha & Ajnaura area
        const polygonCoordinates = [
            { latitude: 25.2600, longitude: 85.3400 },
            { latitude: 25.2600, longitude: 85.4600 },
            { latitude: 25.1600, longitude: 85.4600 },
            { latitude: 25.1600, longitude: 85.3400 }
        ];

        console.log(`\nSetting up Zone: "${zoneName}"...`);
        const zoneResult = await db.collection('food_zones').findOneAndUpdate(
            { name: zoneName },
            {
                $set: {
                    name: zoneName,
                    zoneName: zoneName,
                    country: 'India',
                    serviceLocation: serviceLocation,
                    unit: 'kilometer',
                    coordinates: polygonCoordinates,
                    centerPoint: { latitude: centerLat, longitude: centerLng },
                    serviceRadius: 10,
                    isRadiusEnabled: false,
                    isActive: true,
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            { upsert: true, returnDocument: 'after' }
        );

        const zone = zoneResult.value || await db.collection('food_zones').findOne({ name: zoneName });
        const zoneId = zone._id;
        console.log(`✅ Zone setup complete! Zone ID: ${zoneId}`);

        // ========================================================
        // 2. CREATE OR UPDATE 2 RESTAURANTS IN THIS ZONE
        // ========================================================
        console.log('\nSetting up 2 Restaurants in Lalabigha - Ajnaura Zone...');

        // Restaurant 1: Lalabigha Rasoi
        const r1Data = {
            restaurantName: 'Lalabigha Rasoi',
            ownerName: 'Ramesh Kumar',
            ownerEmail: 'lalabigharasoi@foodsaathi.in',
            ownerPhone: '9000003001',
            restaurantNameNormalized: 'lalabigha rasoi',
            ownerPhoneDigits: '9000003001',
            ownerPhoneLast10: '9000003001',
            primaryContactNumber: '9000003001',
            pureVegRestaurant: true,
            addressLine1: 'Main Road, Vill Lalabigha',
            area: 'Lalabigha',
            city: 'Biharsharif',
            state: 'Bihar',
            pincode: '803114',
            cuisines: ['North Indian', 'Bihari', 'Thali', 'Dhaba'],
            openingTime: '08:00',
            closingTime: '23:00',
            openDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            isAcceptingOrders: true,
            gstRegistered: false,
            menuImages: [],
            coverImages: [
                'https://res.cloudinary.com/dxuuamva/image/upload/v1792826975/foodsaathi/restaurants/mehak-dhaba-bihar-sharif-cover-1.jpg'
            ],
            profileImage: 'https://res.cloudinary.com/dxuuamva/image/upload/v1792826975/foodsaathi/restaurants/mehak-dhaba-bihar-sharif-cover-1.jpg',
            location: {
                type: 'Point',
                coordinates: [85.3970, 25.2155],
                latitude: 25.2155,
                longitude: 85.3970,
                formattedAddress: 'Main Road, Vill Lalabigha, PO Ajnaura, Biharsharif, Bihar 803114',
                address: 'Main Road, Vill Lalabigha, PO Ajnaura, Biharsharif, Bihar 803114',
                addressLine1: 'Main Road, Vill Lalabigha',
                area: 'Lalabigha',
                city: 'Biharsharif',
                state: 'Bihar',
                pincode: '803114'
            },
            zoneId: zoneId,
            estimatedDeliveryTime: '20-30 mins',
            estimatedDeliveryTimeMinutes: 25,
            discount: 10,
            rating: 4.6,
            totalRatings: 35,
            diningSettings: { isEnabled: false, maxGuests: 6, diningType: ['family-dining'] },
            menu: { sections: [] },
            status: 'approved',
            approvalStatus: 'approved',
            isAvailable: true,
            approvedAt: new Date(),
            isBanned: false,
            updatedAt: new Date()
        };

        const r1Result = await db.collection('food_restaurants').findOneAndUpdate(
            { ownerPhone: r1Data.ownerPhone },
            {
                $set: r1Data,
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true, returnDocument: 'after' }
        );
        const r1 = r1Result.value || await db.collection('food_restaurants').findOne({ ownerPhone: r1Data.ownerPhone });
        console.log(`✅ Restaurant 1 created/updated: "${r1.restaurantName}" (ID: ${r1._id})`);

        // Restaurant 2: Ajnaura Food Corner
        const r2Data = {
            restaurantName: 'Ajnaura Food Corner',
            ownerName: 'Sunil Prasad',
            ownerEmail: 'ajnaurafood@foodsaathi.in',
            ownerPhone: '9000003002',
            restaurantNameNormalized: 'ajnaura food corner',
            ownerPhoneDigits: '9000003002',
            ownerPhoneLast10: '9000003002',
            primaryContactNumber: '9000003002',
            pureVegRestaurant: false,
            addressLine1: 'Near Post Office, Ajnaura',
            area: 'Ajnaura',
            city: 'Biharsharif',
            state: 'Bihar',
            pincode: '803114',
            cuisines: ['Fast Food', 'Rolls', 'Chowmein', 'Biryani'],
            openingTime: '09:00',
            closingTime: '22:30',
            openDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            isAcceptingOrders: true,
            gstRegistered: false,
            menuImages: [],
            coverImages: [
                'https://res.cloudinary.com/dxuuamva/image/upload/v1792826975/foodsaathi/restaurants/mehak-dhaba-bihar-sharif-cover-2.jpg'
            ],
            profileImage: 'https://res.cloudinary.com/dxuuamva/image/upload/v1792826975/foodsaathi/restaurants/mehak-dhaba-bihar-sharif-cover-2.jpg',
            location: {
                type: 'Point',
                coordinates: [85.3955, 25.2140],
                latitude: 25.2140,
                longitude: 85.3955,
                formattedAddress: 'Near Post Office, Ajnaura, Biharsharif, Bihar 803114',
                address: 'Near Post Office, Ajnaura, Biharsharif, Bihar 803114',
                addressLine1: 'Near Post Office, Ajnaura',
                area: 'Ajnaura',
                city: 'Biharsharif',
                state: 'Bihar',
                pincode: '803114'
            },
            zoneId: zoneId,
            estimatedDeliveryTime: '25-35 mins',
            estimatedDeliveryTimeMinutes: 30,
            discount: 15,
            rating: 4.5,
            totalRatings: 28,
            diningSettings: { isEnabled: false, maxGuests: 6, diningType: ['family-dining'] },
            menu: { sections: [] },
            status: 'approved',
            approvalStatus: 'approved',
            isAvailable: true,
            approvedAt: new Date(),
            isBanned: false,
            updatedAt: new Date()
        };

        const r2Result = await db.collection('food_restaurants').findOneAndUpdate(
            { ownerPhone: r2Data.ownerPhone },
            {
                $set: r2Data,
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true, returnDocument: 'after' }
        );
        const r2 = r2Result.value || await db.collection('food_restaurants').findOne({ ownerPhone: r2Data.ownerPhone });
        console.log(`✅ Restaurant 2 created/updated: "${r2.restaurantName}" (ID: ${r2._id})`);

        // Add Food Items for both restaurants so menus are full
        const r1Items = [
            {
                name: 'Special Bihari Thali',
                price: 180,
                description: 'Complete meal with seasonal sabji, dal tadka, rice, 4 rotis, salad and sweet.',
                foodType: 'Veg',
                isAvailable: true,
                isRecommended: true,
                categoryName: 'Thali',
                image: 'https://res.cloudinary.com/dxuuamva/image/upload/v1792826977/foodsaathi/foods/mehak-dhaba-bihar-sharif-mehak-special.jpg',
                restaurantId: r1._id,
                approvalStatus: 'approved',
                approvedAt: new Date(),
                variants: []
            },
            {
                name: 'Desi Ghee Litti Chokha (4 pcs)',
                price: 120,
                description: 'Traditional sattu stuffed litti dipped in pure desi ghee with spicy brinjal chokha.',
                foodType: 'Veg',
                isAvailable: true,
                isRecommended: true,
                categoryName: 'Snacks',
                image: 'https://res.cloudinary.com/dxuuamva/image/upload/v1792826977/foodsaathi/foods/mehak-dhaba-bihar-sharif-mehak-special.jpg',
                restaurantId: r1._id,
                approvalStatus: 'approved',
                approvedAt: new Date(),
                variants: []
            },
            {
                name: 'Paneer Butter Masala',
                price: 190,
                description: 'Fresh paneer cubes simmered in rich creamy butter tomato gravy.',
                foodType: 'Veg',
                isAvailable: true,
                isRecommended: true,
                categoryName: 'Main Course',
                image: 'https://res.cloudinary.com/dxuuamva/image/upload/v1792826977/foodsaathi/foods/mehak-dhaba-bihar-sharif-mehak-special.jpg',
                restaurantId: r1._id,
                approvalStatus: 'approved',
                approvedAt: new Date(),
                variants: []
            }
        ];

        const r2Items = [
            {
                name: 'Veg Hakka Noodles',
                price: 90,
                description: 'Wok tossed noodles with crunchy vegetables and spicy Indo-Chinese seasoning.',
                foodType: 'Veg',
                isAvailable: true,
                isRecommended: true,
                categoryName: 'Chinese',
                image: 'https://res.cloudinary.com/dxuuamva/image/upload/v1792826977/foodsaathi/foods/mehak-dhaba-bihar-sharif-mehak-special.jpg',
                restaurantId: r2._id,
                approvalStatus: 'approved',
                approvedAt: new Date(),
                variants: []
            },
            {
                name: 'Special Chicken Egg Roll',
                price: 110,
                description: 'Crispy flaky paratha layered with egg, juicy spiced chicken, and fresh onions.',
                foodType: 'Non-Veg',
                isAvailable: true,
                isRecommended: true,
                categoryName: 'Rolls',
                image: 'https://res.cloudinary.com/dxuuamva/image/upload/v1792826977/foodsaathi/foods/mehak-dhaba-bihar-sharif-mehak-special.jpg',
                restaurantId: r2._id,
                approvalStatus: 'approved',
                approvedAt: new Date(),
                variants: []
            },
            {
                name: 'Hyderabadi Chicken Biryani',
                price: 170,
                description: 'Aromatic basmati rice layered with tender marinated chicken and rich spices.',
                foodType: 'Non-Veg',
                isAvailable: true,
                isRecommended: true,
                categoryName: 'Biryani',
                image: 'https://res.cloudinary.com/dxuuamva/image/upload/v1792826977/foodsaathi/foods/mehak-dhaba-bihar-sharif-mehak-special.jpg',
                restaurantId: r2._id,
                approvalStatus: 'approved',
                approvedAt: new Date(),
                variants: []
            }
        ];

        // Upsert items
        for (const item of r1Items) {
            await db.collection('food_items').updateOne(
                { restaurantId: r1._id, name: item.name },
                { $set: item, $setOnInsert: { createdAt: new Date() } },
                { upsert: true }
            );
        }
        for (const item of r2Items) {
            await db.collection('food_items').updateOne(
                { restaurantId: r2._id, name: item.name },
                { $set: item, $setOnInsert: { createdAt: new Date() } },
                { upsert: true }
            );
        }
        console.log('✅ Menu items added for both restaurants!');

        // ========================================================
        // 3. CREATE OR UPDATE 2 DELIVERY BOYS IN THIS ZONE
        // ========================================================
        console.log('\nSetting up 2 Delivery Boys in Lalabigha - Ajnaura Zone...');

        // Delivery Boy 1: Raju Kumar
        const dp1Data = {
            name: 'Raju Kumar',
            phone: '9000003101',
            email: 'raju.kumar@foodsaathi.in',
            countryCode: '+91',
            address: 'Vill Lalabigha, PO Ajnaura, Biharsharif',
            city: 'Biharsharif',
            state: 'Bihar',
            vehicleType: 'Bike',
            vehicleName: 'Hero Splendor Plus',
            vehicleNumber: 'BR21AB3101',
            drivingLicenseNumber: 'BR2120240003101',
            profilePhoto: 'https://res.cloudinary.com/dxuuamva/image/upload/v1792826996/foodsaathi/delivery/rider-sanjay-kumar.jpg',
            status: 'approved',
            approvedAt: new Date(),
            availabilityStatus: 'online',
            lastLocation: { type: 'Point', coordinates: [85.3965, 25.2152] },
            lastLat: 25.2152,
            lastLng: 85.3965,
            lastLocationAt: new Date(),
            rating: 4.9,
            totalRatings: 52,
            shiftStartAddress: 'Vill Lalabigha, PO Ajnaura, Biharsharif, Bihar',
            shiftStartPic: 'https://res.cloudinary.com/dxuuamva/image/upload/v1793348334/foodsaathi/wp7fmffcimugmqopmsmp.webp',
            shiftStartTime: new Date(),
            updatedAt: new Date()
        };

        const dp1Result = await db.collection('food_delivery_partners').findOneAndUpdate(
            { phone: dp1Data.phone },
            {
                $set: dp1Data,
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true, returnDocument: 'after' }
        );
        const dp1 = dp1Result.value || await db.collection('food_delivery_partners').findOne({ phone: dp1Data.phone });
        console.log(`✅ Delivery Boy 1 created/updated: "${dp1.name}" (${dp1.phone})`);

        // Delivery Boy 2: Pawan Kumar
        const dp2Data = {
            name: 'Pawan Kumar',
            phone: '9000003102',
            email: 'pawan.kumar@foodsaathi.in',
            countryCode: '+91',
            address: 'Near PO Ajnaura, Biharsharif',
            city: 'Biharsharif',
            state: 'Bihar',
            vehicleType: 'Bike',
            vehicleName: 'Honda Shine',
            vehicleNumber: 'BR21CD3102',
            drivingLicenseNumber: 'BR2120240003102',
            profilePhoto: 'https://res.cloudinary.com/dxuuamva/image/upload/v1792826996/foodsaathi/delivery/rider-sanjay-kumar.jpg',
            status: 'approved',
            approvedAt: new Date(),
            availabilityStatus: 'online',
            lastLocation: { type: 'Point', coordinates: [85.3958, 25.2142] },
            lastLat: 25.2142,
            lastLng: 85.3958,
            lastLocationAt: new Date(),
            rating: 4.8,
            totalRatings: 45,
            shiftStartAddress: 'Near Post Office, Ajnaura, Biharsharif, Bihar',
            shiftStartPic: 'https://res.cloudinary.com/dxuuamva/image/upload/v1793348334/foodsaathi/wp7fmffcimugmqopmsmp.webp',
            shiftStartTime: new Date(),
            updatedAt: new Date()
        };

        const dp2Result = await db.collection('food_delivery_partners').findOneAndUpdate(
            { phone: dp2Data.phone },
            {
                $set: dp2Data,
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true, returnDocument: 'after' }
        );
        const dp2 = dp2Result.value || await db.collection('food_delivery_partners').findOne({ phone: dp2Data.phone });
        console.log(`✅ Delivery Boy 2 created/updated: "${dp2.name}" (${dp2.phone})`);

        console.log('\n========================================================');
        console.log('🎉 ALL SET! Summary of created/verified records:');
        console.log('========================================================');
        console.log(`📍 Zone: ${zoneName}`);
        console.log(`   - ID: ${zoneId}`);
        console.log(`   - Center: ${centerLat}, ${centerLng}`);
        console.log(`   - Location: ${serviceLocation}`);
        console.log(`🍽️ Restaurants (2):`);
        console.log(`   1. ${r1.restaurantName} (Phone: ${r1.ownerPhone}) - Status: ${r1.status}`);
        console.log(`   2. ${r2.restaurantName} (Phone: ${r2.ownerPhone}) - Status: ${r2.status}`);
        console.log(`🚴 Delivery Boys (2):`);
        console.log(`   1. ${dp1.name} (Phone: ${dp1.phone}) - Availability: ${dp1.availabilityStatus}`);
        console.log(`   2. ${dp2.name} (Phone: ${dp2.phone}) - Availability: ${dp2.availabilityStatus}`);
        console.log('========================================================\n');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from Mongo.');
    }
}

run();

