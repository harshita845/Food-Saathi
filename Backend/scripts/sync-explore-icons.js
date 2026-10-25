import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import { FoodExploreIcon } from '../src/modules/food/landing/models/exploreIcon.model.js';

async function syncIcons() {
    try {
        await mongoose.connect(config.mongodbUri);
        console.log('Connected to DB');

        const existing = await FoodExploreIcon.find().lean();
        console.log('Existing explore icons:', JSON.stringify(existing, null, 2));

        const targetIcons = [
            {
                label: 'Offers',
                iconUrl: '/uploads/explore_offers.png',
                linkType: 'offers',
                targetPath: '/food/user/offers',
                sortOrder: 1,
                isActive: true
            },
            {
                label: 'Gourmet',
                iconUrl: '/uploads/explore_gourmet.png',
                linkType: 'gourmet',
                targetPath: '/food/user/gourmet',
                sortOrder: 2,
                isActive: true
            },
            {
                label: 'Collections',
                iconUrl: '/uploads/explore_collection.png',
                linkType: 'collections',
                targetPath: '/food/user/profile/favorites',
                sortOrder: 3,
                isActive: true
            }
        ];

        for (const target of targetIcons) {
            const found = await FoodExploreIcon.findOne({
                label: { $regex: new RegExp(`^${target.label}$`, 'i') }
            });

            if (found) {
                found.iconUrl = target.iconUrl;
                found.targetPath = target.targetPath;
                found.sortOrder = target.sortOrder;
                found.isActive = true;
                await found.save();
                console.log(`Updated ${target.label} to ${target.iconUrl}`);
            } else {
                await FoodExploreIcon.create(target);
                console.log(`Created ${target.label} with ${target.iconUrl}`);
            }
        }

        const after = await FoodExploreIcon.find().lean();
        console.log('Explore icons after sync:', JSON.stringify(after, null, 2));

        await mongoose.disconnect();
        console.log('Done!');
        process.exit(0);
    } catch (err) {
        console.error('Error syncing explore icons:', err);
        process.exit(1);
    }
}

syncIcons();
