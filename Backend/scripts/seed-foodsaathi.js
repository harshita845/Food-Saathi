/**
 * Food Saathi starter data.
 *
 * Copies a small slice of the old Jharkhand Rasoi data (see "old db/*.csv") into the new Food Saathi
 * database for the two launch cities, Indore and Bihar Sharif: per city a service zone, 3 restaurants
 * with their dishes and 2 delivery partners. Also seeds the dish categories, business settings with the
 * Food Saathi logo, and a super admin. Data left over from older seeds in other cities is removed.
 *
 * The old database only stored image *filenames*, so dish/restaurant photos are taken from Unsplash
 * and copied into Cloudinary (folder: $CLOUDINARY_FOLDER/<type>). If Cloudinary is not configured the
 * original image URLs are used as-is.
 *
 * Safe to re-run: everything is upserted by name/phone/email.
 *
 * Usage:
 *   node scripts/seed-foodsaathi.js
 *   SEED_ADMIN_EMAIL=you@x.com SEED_ADMIN_PASSWORD=secret node scripts/seed-foodsaathi.js
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

import { connectDB, disconnectDB } from '../src/config/db.js';
import { FoodRestaurant } from '../src/modules/food/restaurant/models/restaurant.model.js';
import { FoodRestaurantOutletTimings } from '../src/modules/food/restaurant/models/outletTimings.model.js';
import { FoodCategory } from '../src/modules/food/admin/models/category.model.js';
import { FoodItem } from '../src/modules/food/admin/models/food.model.js';
import { FoodZone } from '../src/modules/food/admin/models/zone.model.js';
import { FoodDeliveryPartner } from '../src/modules/food/delivery/models/deliveryPartner.model.js';
import { FoodBusinessSettings } from '../src/modules/food/admin/models/businessSettings.model.js';
import { FoodAdmin } from '../src/core/admin/admin.model.js';
import { AppConfig } from '../src/core/appConfig/appConfig.model.js';
import UploadSetting from '../src/models/UploadSetting.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.resolve(__dirname, '../../Frontend/public/foodsaathi-logo.png');
const MARK_PATH = path.resolve(__dirname, '../../Frontend/public/foodsaathi-mark.png');

const img = (id, w = 600) => `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

// ── Categories used by the seeded dishes (names match the old "categories.csv") ──────────────────
const CATEGORIES = [
    { name: 'Sweets / Desserts', image: img('photo-1666190092159-3171cf0fbb12', 400), foodTypeScope: 'Veg' },
    { name: 'Chaat', image: img('photo-1601050690597-df0568f70950', 400), foodTypeScope: 'Veg' },
    { name: 'Thali', image: img('photo-1546833999-b9f581a1996d', 400), foodTypeScope: 'Both' },
    { name: 'Indian Course Veg', image: img('photo-1631452180519-c014fe946bc7', 400), foodTypeScope: 'Veg' },
    { name: 'Bread Station', image: img('photo-1565557623262-b51c2513a641', 400), foodTypeScope: 'Veg' },
    { name: 'Chaaps', image: img('photo-1567188040759-fb8a883dc6d8', 400), foodTypeScope: 'Veg' },
    { name: 'Soups', image: img('photo-1547592180-85f173990554', 400), foodTypeScope: 'Both' },
    { name: 'Pizzas', image: img('photo-1565299624946-b28f40a0ae38', 400), foodTypeScope: 'Both' },
    { name: 'Pastas', image: img('photo-1473093295043-cdd812d0e601', 400), foodTypeScope: 'Both' },
    { name: 'Burgers', image: img('photo-1568901346375-23c9450c58cd', 400), foodTypeScope: 'Both' },
    { name: 'Wraps', image: img('photo-1626700051175-6818013e1d4f', 400), foodTypeScope: 'Both' },
    { name: 'Raita / Salad', image: img('photo-1512621776951-a57141f2eefd', 400), foodTypeScope: 'Both' },
    { name: 'Non Veg Tandoori', image: img('photo-1599487488170-d11ec9c172f0', 400), foodTypeScope: 'Non-Veg' },
    { name: 'Shakes/Crush', image: img('photo-1572490122747-3968b75cc699', 400), foodTypeScope: 'Veg' },
    { name: 'Mocktails / Smoothies', image: img('photo-1551538827-9c037cb4f32a', 400), foodTypeScope: 'Veg' },
    { name: 'Indian Snacks', image: img('photo-1573080496219-bb080dd4f877', 400), foodTypeScope: 'Veg' },
];

// ── Launch cities ────────────────────────────────────────────────────────────────────────────────
// Restaurants and menus come from the old data (old restaurant ids noted per entry); addresses,
// phone numbers and coordinates are new demo values in each city.
const CITIES = [
    {
        zone: {
            name: 'Indore',
            serviceLocation: 'Indore, Madhya Pradesh',
            center: { latitude: 22.7196, longitude: 75.8577 },
            // Box covering Indore city
            coordinates: [
                { latitude: 22.8200, longitude: 75.7500 },
                { latitude: 22.8200, longitude: 75.9800 },
                { latitude: 22.6000, longitude: 75.9800 },
                { latitude: 22.6000, longitude: 75.7500 },
            ],
        },
        city: 'Indore',
        state: 'Madhya Pradesh',
        restaurants: [
            {
                legacyId: 2,
                restaurantName: 'Vicky Sweets',
                phone: '9000001001',
                email: 'vickysweets@foodsaathi.in',
                address: '45, MG Road, Near Gandhi Hall',
                area: 'MG Road',
                pincode: '452007',
                lat: 22.7205,
                lng: 75.8698,
                pureVeg: true,
                cuisines: ['Sweets', 'North Indian', 'Chaat', 'Thali'],
                rating: 4.6,
                totalRatings: 58,
                deliveryTime: '20-30 mins',
                deliveryMinutes: 25,
                profileImage: img('photo-1606471191009-63994c53433b', 500),
                coverImages: [img('photo-1589119908995-c6837fa14848', 1000), img('photo-1546833999-b9f581a1996d', 1000)],
                foods: [
                    { name: 'Gulab Jamun (2 Pcs)', category: 'Sweets / Desserts', price: 60, veg: true, description: 'Soft khoya dumplings soaked in warm cardamom syrup.', image: img('photo-1666190092159-3171cf0fbb12') },
                    { name: 'Rasmalai (2 Pcs)', category: 'Sweets / Desserts', price: 90, veg: true, description: 'Chenna patties in chilled saffron-pistachio milk.', image: img('photo-1589119908995-c6837fa14848') },
                    { name: 'Channa Samosa', category: 'Chaat', price: 43, veg: true, description: 'Crispy samosa smashed and topped with spiced chickpeas, chutneys and onions.', image: img('photo-1601050690597-df0568f70950') },
                    { name: 'Aloo Tikki Chaat', category: 'Chaat', price: 70, veg: true, description: 'Golden potato tikkis with curd, tamarind and mint chutney.', image: img('photo-1626132647523-66f5bf380027') },
                    { name: 'Special Veg Thali', category: 'Thali', price: 199, veg: true, description: 'Dal makhani, paneer, seasonal sabzi, rice, raita, 2 rotis and a sweet.', image: img('photo-1546833999-b9f581a1996d'), recommended: true },
                    { name: 'Mint Mojito', category: 'Mocktails / Smoothies', price: 116, veg: true, description: 'A classic cooler with fresh mint, lime and soda.', image: img('photo-1551538827-9c037cb4f32a') },
                ],
            },
            {
                legacyId: 4,
                restaurantName: 'The Bella Ciao',
                phone: '9000001002',
                email: 'bellaciao@foodsaathi.in',
                address: '12, Old Palasia, Near Palasia Square',
                area: 'Old Palasia',
                pincode: '452001',
                lat: 22.7244,
                lng: 75.8839,
                pureVeg: false,
                cuisines: ['Italian', 'Pizza', 'Continental', 'Tandoor'],
                rating: 4.7,
                totalRatings: 91,
                deliveryTime: '20-25 mins',
                deliveryMinutes: 22,
                profileImage: img('photo-1555396273-367ea4eb4db5', 500),
                coverImages: [img('photo-1513104890138-7c749659a591', 1000), img('photo-1517248135467-4c7edcad34c4', 1000)],
                foods: [
                    { name: 'Margherita Pizza', category: 'Pizzas', price: 199, veg: true, description: 'Hand-stretched base, tangy tomato sauce and loads of mozzarella.', image: img('photo-1574071318508-1cdbab80d002'), recommended: true },
                    { name: 'Farmhouse Pizza', category: 'Pizzas', price: 259, veg: true, description: 'Onion, capsicum, tomato and mushroom on a cheesy base.', image: img('photo-1565299624946-b28f40a0ae38') },
                    { name: 'White Sauce Pasta', category: 'Pastas', price: 233, veg: true, description: 'Penne tossed in a creamy béchamel with herbs and veggies.', image: img('photo-1645112411341-6c4fd023714a') },
                    { name: 'Chicken Tikka [Boneless 10 Pc]', category: 'Non Veg Tandoori', price: 326, veg: false, description: 'Boneless chicken marinated in yogurt and spices, charred in the tandoor.', image: img('photo-1599487488170-d11ec9c172f0'), recommended: true },
                    { name: 'Crispy Paneer Wrap', category: 'Wraps', price: 148, veg: true, description: 'Crunchy paneer, onions and mint mayo rolled in a soft wrap.', image: img('photo-1626700051175-6818013e1d4f') },
                    { name: 'Butter Scotch Shake', category: 'Shakes/Crush', price: 104, veg: true, description: 'Thick, creamy butterscotch shake topped with crunchy praline.', image: img('photo-1572490122747-3968b75cc699') },
                ],
            },
            {
                legacyId: 8,
                restaurantName: 'Burger Bite',
                phone: '9000001003',
                email: 'burgerbite@foodsaathi.in',
                address: '7, Chhoti Gwaltoli, Near Indore Railway Station',
                area: 'Chhoti Gwaltoli',
                pincode: '452007',
                lat: 22.7168,
                lng: 75.8711,
                pureVeg: false,
                cuisines: ['Burgers', 'Fast Food', 'Sandwich', 'Shakes'],
                rating: 4.5,
                totalRatings: 64,
                deliveryTime: '15-25 mins',
                deliveryMinutes: 20,
                profileImage: img('photo-1571091718767-18b5b1457add', 500),
                coverImages: [img('photo-1550547660-d9450f859349', 1000), img('photo-1561758033-d89a9ad46330', 1000)],
                foods: [
                    { name: 'Aloo Tikki Burger', category: 'Burgers', price: 47, veg: true, description: 'The desi favourite: crispy aloo tikki, onions and tangy sauce.', image: img('photo-1568901346375-23c9450c58cd'), recommended: true },
                    { name: 'Double Cheese Burger', category: 'Burgers', price: 115, veg: true, description: 'Two cheese slices, crunchy veg patty and house mayo.', image: img('photo-1550547660-d9450f859349') },
                    { name: 'Crispy Chicken Burger', category: 'Burgers', price: 139, veg: false, description: 'Fried chicken fillet, lettuce and peri-peri mayo.', image: img('photo-1606755962773-d324e0a13086') },
                    { name: 'Peri Peri Fries', category: 'Indian Snacks', price: 104, veg: true, description: 'Golden fries tossed in fiery peri-peri masala.', image: img('photo-1573080496219-bb080dd4f877') },
                    { name: 'Red Sauce Pasta', category: 'Pastas', price: 114, veg: true, description: 'Penne in a tangy, herby tomato sauce.', image: img('photo-1563379926898-05f4575a45d8') },
                    { name: 'Blue Curacao Mojito', category: 'Mocktails / Smoothies', price: 83, veg: true, description: 'A striking blue cooler with lime and mint.', image: img('photo-1546171753-97d7676e4602') },
                ],
            },
        ],
        riders: [
            { name: 'Rahul Verma', phone: '9000001101', vehicleName: 'Hero Splendor Plus', vehicleNumber: 'MP09AB1101', drivingLicenseNumber: 'MP0920240001101', profilePhoto: img('photo-1507003211169-0a1dd7228f2d', 400), lat: 22.7190, lng: 75.8725 },
            { name: 'Amit Yadav', phone: '9000001102', vehicleName: 'Honda Activa 6G', vehicleNumber: 'MP09CD1102', drivingLicenseNumber: 'MP0920240001102', profilePhoto: img('photo-1500648767791-00dcc994a43e', 400), lat: 22.7231, lng: 75.8790 },
        ],
    },
    {
        zone: {
            name: 'Bihar Sharif',
            serviceLocation: 'Bihar Sharif, Nalanda, Bihar',
            center: { latitude: 25.1982, longitude: 85.5149 },
            // Box covering Bihar Sharif town (Nalanda district)
            coordinates: [
                { latitude: 25.2600, longitude: 85.4500 },
                { latitude: 25.2600, longitude: 85.5800 },
                { latitude: 25.1400, longitude: 85.5800 },
                { latitude: 25.1400, longitude: 85.4500 },
            ],
        },
        city: 'Bihar Sharif',
        state: 'Bihar',
        restaurants: [
            {
                legacyId: 19,
                restaurantName: 'Mehak Dhaba',
                phone: '9000002001',
                email: 'mehakdhaba@foodsaathi.in',
                address: 'Ramchandrapur, Near Bus Stand',
                area: 'Ramchandrapur',
                pincode: '803101',
                lat: 25.2021,
                lng: 85.5196,
                pureVeg: true,
                cuisines: ['North Indian', 'Punjabi', 'Dhaba'],
                rating: 4.4,
                totalRatings: 47,
                deliveryTime: '25-35 mins',
                deliveryMinutes: 30,
                profileImage: img('photo-1585937421612-70a008356fbe', 500),
                coverImages: [img('photo-1565557623262-b51c2513a641', 1000), img('photo-1631452180519-c014fe946bc7', 1000)],
                foods: [
                    { name: 'Mehak Special', category: 'Indian Course Veg', price: 175, veg: true, description: 'Exclusive from Mehak Dhaba — rich paneer and vegetable gravy cooked dhaba style.', image: img('photo-1631452180519-c014fe946bc7'), recommended: true },
                    { name: 'Daal Makhni', category: 'Indian Course Veg', price: 175, veg: true, description: 'Black lentils slow-cooked overnight with butter and cream.', image: img('photo-1585937421612-70a008356fbe'), recommended: true },
                    { name: 'Butter Naan', category: 'Bread Station', price: 35, veg: true, description: 'Soft tandoor-baked naan brushed with butter.', image: img('photo-1565557623262-b51c2513a641') },
                    { name: 'Missi Roti Punjabi', category: 'Bread Station', price: 24, veg: true, description: 'North Indian flatbread made with gram flour and spices.', image: img('photo-1546833999-b9f581a1996d') },
                    { name: 'Masala Papad', category: 'Indian Snacks', price: 93, veg: true, description: 'Crisp papad topped with onion, tomato, chilli and chaat masala.', image: img('photo-1601050690597-df0568f70950') },
                    { name: 'Mix Raita', category: 'Raita / Salad', price: 82, veg: true, description: 'Chilled curd with cucumber, onion, tomato and roasted cumin.', image: img('photo-1512621776951-a57141f2eefd') },
                ],
            },
            {
                legacyId: 7,
                restaurantName: 'Pizza13',
                phone: '9000002002',
                email: 'pizza13@foodsaathi.in',
                address: 'Bhaisasur, Near Hospital Mor',
                area: 'Bhaisasur',
                pincode: '803101',
                lat: 25.1953,
                lng: 85.5225,
                pureVeg: true,
                cuisines: ['Pizza', 'Chinese', 'North Indian', 'Chaap'],
                rating: 4.5,
                totalRatings: 72,
                deliveryTime: '20-30 mins',
                deliveryMinutes: 25,
                profileImage: img('photo-1513104890138-7c749659a591', 500),
                coverImages: [img('photo-1604382354936-07c5d9983bd3', 1000), img('photo-1565299624946-b28f40a0ae38', 1000)],
                foods: [
                    { name: 'Farmhouse Pizza', category: 'Pizzas', price: 249, veg: true, description: 'Onion, capsicum, tomato and mushroom on a cheesy base.', image: img('photo-1604382354936-07c5d9983bd3'), recommended: true },
                    { name: 'Margherita Pizza', category: 'Pizzas', price: 189, veg: true, description: 'Classic tomato sauce and mozzarella on a hand-stretched base.', image: img('photo-1574071318508-1cdbab80d002') },
                    { name: 'Tandoori Soya Chaap', category: 'Chaaps', price: 179, veg: true, description: 'Soya chaap marinated in tandoori masala and charred in the tandoor.', image: img('photo-1567188040759-fb8a883dc6d8'), recommended: true },
                    { name: 'Malai Chaap', category: 'Chaaps', price: 301, veg: true, description: 'Soya chaap in a creamy, mildly spiced malai marinade.', image: img('photo-1599487488170-d11ec9c172f0') },
                    { name: 'Shahi Paneer', category: 'Indian Course Veg', price: 324, veg: true, description: 'Paneer in a rich cashew, cream and tomato gravy.', image: img('photo-1631452180519-c014fe946bc7') },
                    { name: 'Veg Manchow Soup', category: 'Soups', price: 94, veg: true, description: 'Spicy Indo-Chinese soup with vegetables and crispy noodles.', image: img('photo-1547592180-85f173990554') },
                ],
            },
            {
                legacyId: 9,
                restaurantName: 'Crafty Bean',
                phone: '9000002003',
                email: 'craftybean@foodsaathi.in',
                address: 'Sohsarai, Main Road',
                area: 'Sohsarai',
                pincode: '803101',
                lat: 25.1867,
                lng: 85.5050,
                pureVeg: false,
                cuisines: ['Cafe', 'Burgers', 'Wraps', 'Shakes'],
                rating: 4.6,
                totalRatings: 55,
                deliveryTime: '20-30 mins',
                deliveryMinutes: 25,
                profileImage: img('photo-1554118811-1e0d58224f24', 500),
                coverImages: [img('photo-1559925393-8be0ec4767c8', 1000), img('photo-1572490122747-3968b75cc699', 1000)],
                foods: [
                    { name: 'Very Bery Oreo Shake', category: 'Shakes/Crush', price: 147, veg: true, description: 'Cookies-and-cream shake blended with crushed Oreos.', image: img('photo-1572490122747-3968b75cc699'), recommended: true },
                    { name: 'Chicken Crust Wrap', category: 'Wraps', price: 153, veg: false, description: 'Crispy chicken fillet, veggies and sauces rolled in a soft wrap.', image: img('photo-1626700051175-6818013e1d4f') },
                    { name: 'Egg Burger', category: 'Burgers', price: 83, veg: false, description: 'Fried egg, onions and mayo in a toasted bun.', image: img('photo-1550547660-d9450f859349') },
                    { name: 'Cheesy Garlic Bread', category: 'Indian Snacks', price: 110, veg: true, description: 'Toasted garlic bread loaded with melted cheese.', image: img('photo-1573080496219-bb080dd4f877') },
                    { name: 'White Sauce Pasta', category: 'Pastas', price: 147, veg: true, description: 'Creamy béchamel penne with herbs and vegetables.', image: img('photo-1645112411341-6c4fd023714a') },
                    { name: 'Paneer Crunch Salad', category: 'Raita / Salad', price: 147, veg: true, description: 'Fresh greens with crispy paneer and a tangy dressing.', image: img('photo-1512621776951-a57141f2eefd') },
                ],
            },
        ],
        riders: [
            { name: 'Sanjay Kumar', phone: '9000002101', vehicleName: 'Bajaj Platina', vehicleNumber: 'BR21AB2101', drivingLicenseNumber: 'BR2120240002101', profilePhoto: img('photo-1507003211169-0a1dd7228f2d', 400), lat: 25.1990, lng: 85.5160 },
            { name: 'Vikash Singh', phone: '9000002102', vehicleName: 'TVS Jupiter', vehicleNumber: 'BR21CD2102', drivingLicenseNumber: 'BR2120240002102', profilePhoto: img('photo-1500648767791-00dcc994a43e', 400), lat: 25.1935, lng: 85.5110 },
        ],
    },
];

// ── Cloudinary helpers ───────────────────────────────────────────────────────────────────────────
const cloudinaryReady = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
);
if (cloudinaryReady) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
}
const ROOT_FOLDER = (process.env.CLOUDINARY_FOLDER || 'foodsaathi').trim();
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Copies a remote URL or local file into Cloudinary; returns the original source on failure. */
async function toCloudinary(source, publicId, subFolder = 'seed') {
    if (!cloudinaryReady) return { url: source, publicId: '' };
    try {
        const res = await cloudinary.uploader.upload(source, {
            folder: `${ROOT_FOLDER}/${subFolder}`,
            public_id: slug(publicId),
            overwrite: false,
            resource_type: 'image',
        });
        return { url: res.secure_url, publicId: res.public_id };
    } catch (err) {
        console.warn(`  ! Cloudinary upload failed for ${publicId}: ${err.message} — using original URL`);
        return { url: source, publicId: '' };
    }
}

// ── Seed ─────────────────────────────────────────────────────────────────────────────────────────
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Removes zones, restaurants (with dishes and timings) and riders outside the launch cities. */
async function removeOtherCities() {
    const keepCities = CITIES.map((c) => c.city);
    const keepZones = CITIES.map((c) => c.zone.name);
    const keepRestaurantPhones = CITIES.flatMap((c) => c.restaurants.map((r) => r.phone));
    const keepRiderPhones = CITIES.flatMap((c) => c.riders.map((d) => d.phone));

    const staleRestaurants = await FoodRestaurant.find({
        $or: [{ city: { $nin: keepCities } }, { city: { $in: keepCities }, ownerPhone: { $nin: keepRestaurantPhones } }],
    }).select('_id restaurantName city').lean();
    const staleIds = staleRestaurants.map((r) => r._id);
    if (staleIds.length) {
        await FoodItem.deleteMany({ restaurantId: { $in: staleIds } });
        await FoodRestaurantOutletTimings.deleteMany({ restaurantId: { $in: staleIds } });
        await FoodRestaurant.deleteMany({ _id: { $in: staleIds } });
    }
    const riders = await FoodDeliveryPartner.deleteMany({ phone: { $nin: keepRiderPhones } });
    const zones = await FoodZone.deleteMany({ name: { $nin: keepZones } });
    console.log(`✓ Removed other cities: ${staleIds.length} restaurants, ${riders.deletedCount} riders, ${zones.deletedCount} zones`);
}

async function seedRestaurant(r, cityDef, zone, categoryIds) {
    const profile = await toCloudinary(r.profileImage, `${r.restaurantName}-${cityDef.city}-profile`, 'restaurants');
    const covers = [];
    for (const [i, c] of r.coverImages.entries()) {
        covers.push((await toCloudinary(c, `${r.restaurantName}-${cityDef.city}-cover-${i + 1}`, 'restaurants')).url);
    }
    const formattedAddress = `${r.address}, ${cityDef.city}, ${cityDef.state} ${r.pincode}`;
    const payload = {
        restaurantName: r.restaurantName,
        restaurantNameNormalized: r.restaurantName.toLowerCase(),
        ownerName: r.restaurantName,
        ownerEmail: r.email,
        ownerPhone: r.phone,
        ownerPhoneDigits: r.phone,
        ownerPhoneLast10: r.phone.slice(-10),
        primaryContactNumber: r.phone,
        pureVegRestaurant: r.pureVeg,
        addressLine1: r.address,
        area: r.area,
        city: cityDef.city,
        state: cityDef.state,
        pincode: r.pincode,
        location: {
            type: 'Point',
            coordinates: [r.lng, r.lat],
            latitude: r.lat,
            longitude: r.lng,
            formattedAddress,
            address: formattedAddress,
            addressLine1: r.address,
            area: r.area,
            city: cityDef.city,
            state: cityDef.state,
            pincode: r.pincode,
        },
        zoneId: zone._id,
        cuisines: r.cuisines,
        rating: r.rating,
        totalRatings: r.totalRatings,
        status: 'approved',
        approvedAt: new Date(),
        isAcceptingOrders: true,
        openingTime: '08:00',
        closingTime: '23:30',
        openDays: DAYS,
        estimatedDeliveryTime: r.deliveryTime,
        estimatedDeliveryTimeMinutes: r.deliveryMinutes,
        profileImage: profile.url,
        coverImages: covers,
    };

    let restaurant = await FoodRestaurant.findOne({ ownerPhone: r.phone })
        || await FoodRestaurant.findOne({ restaurantNameNormalized: payload.restaurantNameNormalized });
    if (restaurant) Object.assign(restaurant, payload), await restaurant.save();
    else restaurant = await FoodRestaurant.create(payload);

    await FoodRestaurantOutletTimings.findOneAndUpdate(
        { restaurantId: restaurant._id },
        { $set: { timings: DAYS.map((day) => ({ day, isOpen: true, openingTime: '08:00', closingTime: '23:30' })) } },
        { upsert: true, new: true }
    );

    await FoodItem.deleteMany({ restaurantId: restaurant._id, name: { $nin: r.foods.map((f) => f.name) } });
    for (const f of r.foods) {
        const image = await toCloudinary(f.image, `${r.restaurantName}-${cityDef.city}-${f.name}`, 'foods');
        await FoodItem.findOneAndUpdate(
            { restaurantId: restaurant._id, name: f.name },
            {
                $set: {
                    restaurantId: restaurant._id,
                    categoryId: categoryIds[f.category],
                    categoryName: f.category,
                    name: f.name,
                    description: f.description,
                    price: f.price,
                    image: image.url,
                    foodType: f.veg ? 'Veg' : 'Non-Veg',
                    isAvailable: true,
                    isRecommended: Boolean(f.recommended),
                    approvalStatus: 'approved',
                    approvedAt: new Date(),
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }
    console.log(`  ✓ Restaurant: ${r.restaurantName} (login +91 ${r.phone}) — ${r.foods.length} dishes`);
}

async function seedRider(d, cityDef) {
    const photo = await toCloudinary(d.profilePhoto, `rider-${d.name}`, 'delivery');
    const payload = {
        name: d.name,
        phone: d.phone,
        countryCode: '+91',
        email: `${slug(d.name)}@foodsaathi.in`,
        address: `${cityDef.city}, ${cityDef.state}`,
        city: cityDef.city,
        state: cityDef.state,
        vehicleType: 'Bike',
        vehicleName: d.vehicleName,
        vehicleNumber: d.vehicleNumber,
        drivingLicenseNumber: d.drivingLicenseNumber,
        status: 'approved',
        approvedAt: new Date(),
        availabilityStatus: 'offline',
        lastLocation: { type: 'Point', coordinates: [d.lng, d.lat] },
        lastLat: d.lat,
        lastLng: d.lng,
        lastLocationAt: new Date(),
        profilePhoto: photo.url,
        rating: 4.8,
        totalRatings: 40,
    };
    const existing = await FoodDeliveryPartner.findOne({ phone: d.phone });
    if (existing) Object.assign(existing, payload), await existing.save();
    else await FoodDeliveryPartner.create(payload);
    console.log(`  ✓ Delivery partner: ${d.name} (login +91 ${d.phone})`);
}

async function seed() {
    await connectDB();
    console.log(`Connected. Cloudinary: ${cloudinaryReady ? `on (folder ${ROOT_FOLDER})` : 'off — using source URLs'}\n`);

    // 1. Brand / business settings
    const logo = await toCloudinary(LOGO_PATH, 'foodsaathi-logo', 'brand');
    const mark = await toCloudinary(MARK_PATH, 'foodsaathi-mark', 'brand');
    const brandFields = {
        companyName: 'Food Saathi',
        email: process.env.SEED_ADMIN_EMAIL || 'admin@foodsaathi.in',
        supportEmail: 'support@foodsaathi.in',
        region: 'India',
        state: '',
        // Only Cloudinary URLs are stored; local paths mean the app falls back to its bundled logo.
        ...(logo.publicId ? { logo, userLogo: logo, restaurantLogo: logo, deliveryLogo: logo } : {}),
        ...(mark.publicId ? { favicon: mark } : {}),
    };
    const existingSettings = await FoodBusinessSettings.findOne();
    if (existingSettings) {
        Object.assign(existingSettings, brandFields);
        await existingSettings.save();
    } else {
        await FoodBusinessSettings.create(brandFields);
    }
    console.log('✓ Business settings: Food Saathi', logo.publicId ? `(logo ${logo.url})` : '');

    // Theme per app (read by the frontend's applyDynamicTheme). Admin's primary colour is the sidebar.
    const themes = {
        user_app: { primaryColor: '#F2541B', secondaryColor: '#FFA51F' },
        restaurant_app: { primaryColor: '#F2541B', secondaryColor: '#C93C0E' },
        delivery_app: { primaryColor: '#F2541B', secondaryColor: '#C93C0E' },
        admin_app: { primaryColor: '#3A1C10', secondaryColor: '#2C1A11' },
    };
    for (const [appName, colors] of Object.entries(themes)) {
        await AppConfig.findOneAndUpdate(
            { appName },
            { $set: { appName, ...colors, logoUrl: logo.publicId ? logo.url : '', fontFamily: "'Poppins', sans-serif" } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }
    console.log('✓ App themes: user, restaurant, delivery, admin');

    // Uploads go to Cloudinary when it is configured (admin can switch back to local uploads/)
    const provider = cloudinaryReady ? 'cloudinary' : 'local';
    await UploadSetting.findOneAndUpdate({ key: 'singleton' }, { $set: { imageUploadProvider: provider } }, { upsert: true });
    console.log(`✓ Upload provider: ${provider}`);

    // 2. Super admin
    const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@foodsaathi.in').toLowerCase();
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'FoodSaathi@123';
    const admin = await FoodAdmin.findOne({ email: adminEmail });
    if (!admin) {
        await FoodAdmin.create({
            email: adminEmail,
            password: adminPassword,
            name: 'Food Saathi Admin',
            role: 'SUPER_ADMIN',
            servicesAccess: ['food'],
            isActive: true,
        });
        console.log(`✓ Admin created: ${adminEmail} / ${adminPassword}`);
    } else {
        console.log(`✓ Admin exists: ${adminEmail}`);
    }

    // 3. Only the launch cities stay in the database
    await removeOtherCities();

    // 4. Categories
    const categoryIds = {};
    for (const [i, cat] of CATEGORIES.entries()) {
        const image = await toCloudinary(cat.image, `category-${cat.name}`, 'categories');
        const doc = await FoodCategory.findOneAndUpdate(
            { name: cat.name },
            { $set: { name: cat.name, image: image.url, foodTypeScope: cat.foodTypeScope, isActive: true, isApproved: true, sortOrder: i + 1 } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        categoryIds[cat.name] = doc._id;
    }
    console.log(`✓ Categories: ${CATEGORIES.length}`);

    // 5. Per city: zone, restaurants, riders
    for (const cityDef of CITIES) {
        const zonePayload = {
            name: cityDef.zone.name,
            zoneName: cityDef.zone.name,
            serviceLocation: cityDef.zone.serviceLocation,
            country: 'India',
            coordinates: cityDef.zone.coordinates,
            centerPoint: cityDef.zone.center,
            isActive: true,
        };
        let zone = await FoodZone.findOne({ name: cityDef.zone.name });
        if (zone) Object.assign(zone, zonePayload), await zone.save();
        else zone = await FoodZone.create(zonePayload);
        console.log(`\n✓ Zone: ${zone.name}`);

        for (const r of cityDef.restaurants) await seedRestaurant(r, cityDef, zone, categoryIds);
        for (const d of cityDef.riders) await seedRider(d, cityDef);
    }

    console.log('\n✅ Food Saathi seed complete.');
}

seed()
    .then(() => disconnectDB())
    .then(() => process.exit(0))
    .catch(async (err) => {
        console.error('❌ Seed failed:', err);
        await disconnectDB().catch(() => {});
        process.exit(1);
    });
