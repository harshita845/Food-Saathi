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

async function updateDeliveryBoys() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    const zone = await db.collection('food_zones').findOne({ name: 'Lalabigha - Ajnaura' });
    if (!zone) {
        console.error('Zone not found!');
        return;
    }
    const zoneId = zone._id;
    console.log('Target Zone:', zone.name, 'ID:', zoneId);

    const updateData = {
        zone: 'Lalabigha - Ajnaura',
        zoneName: 'Lalabigha - Ajnaura',
        zoneId: zoneId,
        city: 'Lalabigha - Ajnaura',
        address: 'Vill Lalabigha, Post Office Ajnaura, Biharsharif',
        shiftStartAddress: 'Vill Lalabigha, Post Office Ajnaura, Biharsharif',
        state: 'Bihar',
        status: 'approved',
        availabilityStatus: 'online',
        updatedAt: new Date()
    };

    const res1 = await db.collection('food_delivery_partners').updateOne(
        { phone: '9000003101' },
        { $set: updateData }
    );
    console.log('Raju Kumar update result:', res1);

    const res2 = await db.collection('food_delivery_partners').updateOne(
        { phone: '9000003102' },
        { $set: updateData }
    );
    console.log('Pawan Kumar update result:', res2);

    // Verify
    const updated = await db.collection('food_delivery_partners').find({
        phone: { $in: ['9000003101', '9000003102'] }
    }).project({
        name: 1,
        phone: 1,
        zone: 1,
        zoneName: 1,
        zoneId: 1,
        city: 1,
        address: 1,
        availabilityStatus: 1
    }).toArray();

    console.log('\nVerified Delivery Partners:');
    console.log(JSON.stringify(updated, null, 2));

    await mongoose.disconnect();
}

updateDeliveryBoys();

