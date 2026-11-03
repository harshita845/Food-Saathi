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

async function verify() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    const zone = await db.collection('food_zones').findOne({ name: 'Lalabigha - Ajnaura' });
    console.log('✅ Zone Verified:');
    console.log('  Name:', zone.name);
    console.log('  Location:', zone.serviceLocation);
    console.log('  Center:', zone.centerPoint);
    console.log('  Coordinates count:', zone.coordinates?.length);

    const restaurants = await db.collection('food_restaurants').find({ zoneId: zone._id }).toArray();
    console.log('\n✅ Restaurants in this Zone (' + restaurants.length + '):');
    for (const r of restaurants) {
        const itemCount = await db.collection('food_items').countDocuments({ restaurantId: r._id });
        console.log(`  - ${r.restaurantName} | Owner: ${r.ownerName} (${r.ownerPhone}) | Status: ${r.status} | Location: [${r.location.coordinates}] | Items: ${itemCount}`);
    }

    const riders = await db.collection('food_delivery_partners').find({ phone: { $in: ['9000003101', '9000003102'] } }).toArray();
    console.log('\n✅ Delivery Boys in this Zone (' + riders.length + '):');
    for (const d of riders) {
        console.log(`  - ${d.name} | Phone: ${d.phone} | Status: ${d.status} | Availability: ${d.availabilityStatus} | Location: (${d.lastLat}, ${d.lastLng})`);
    }

    await mongoose.disconnect();
}

verify();

