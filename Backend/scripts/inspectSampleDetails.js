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

    const mehak = await db.collection('food_restaurants').findOne({ restaurantName: 'Mehak Dhaba' });
    console.log('Mehak Dhaba keys and sample values:');
    for (const [k, v] of Object.entries(mehak || {})) {
        if (typeof v === 'string' && v.length > 80) {
            console.log(`  ${k}: (string length ${v.length})`);
        } else {
            console.log(`  ${k}:`, v);
        }
    }

    const items = await db.collection('food_items').find({ restaurantId: mehak._id }).toArray();
    console.log(`\nMehak food items count: ${items.length}`);
    if (items.length > 0) {
        console.log('Sample item:', items[0]);
    }

    const partner = await db.collection('food_delivery_partners').findOne({ phone: '9000002101' });
    console.log('\nSample Delivery Partner (Sanjay Kumar):');
    for (const [k, v] of Object.entries(partner || {})) {
        console.log(`  ${k}:`, v);
    }

    await mongoose.disconnect();
}
run();

