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
        console.log('Connecting to Mongo...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected to Mongo successfully!');
        const db = mongoose.connection.db;

        // 1. Check existing zones
        const existingZones = await db.collection('food_zones').find({}).toArray();
        console.log('\nExisting zones:', existingZones.map(z => ({ id: z._id, name: z.name, serviceLocation: z.serviceLocation })));

        // 2. Check existing restaurants
        const existingRestaurants = await db.collection('food_restaurants').find({}).project({
            restaurantName: 1,
            ownerPhone: 1,
            zoneId: 1,
            city: 1,
            status: 1
        }).toArray();
        console.log('\nExisting restaurants count:', existingRestaurants.length);
        console.log('Sample restaurants:', existingRestaurants.slice(0, 5));

        // 3. Check existing delivery partners
        const existingDelivery = await db.collection('food_delivery_partners').find({}).project({
            name: 1,
            phone: 1,
            status: 1,
            availabilityStatus: 1,
            city: 1,
            lastLat: 1,
            lastLng: 1
        }).toArray();
        console.log('\nExisting delivery partners count:', existingDelivery.length);
        console.log('Delivery partners:', existingDelivery);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();

