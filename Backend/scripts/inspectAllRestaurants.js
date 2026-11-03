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
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    const bsfZone = await db.collection('food_zones').findOne({ _id: new mongoose.Types.ObjectId('6adc5e5e09dfe5f069325bae') });
    console.log('Bihar Sharif Zone details:', JSON.stringify(bsfZone, null, 2));

    const restaurants = await db.collection('food_restaurants').find({}).project({
        restaurantName: 1,
        ownerPhone: 1,
        zoneId: 1,
        city: 1,
        addressLine1: 1,
        location: 1,
        status: 1
    }).toArray();
    console.log('\nAll 9 restaurants:', JSON.stringify(restaurants, null, 2));

    await mongoose.disconnect();
}
run();

