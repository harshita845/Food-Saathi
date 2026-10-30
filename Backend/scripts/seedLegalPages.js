/**
 * Seed Terms & Privacy content for Food Saathi
 * Run: node scripts/seedLegalPages.js
 * 
 * This will insert/update terms and privacy pages in the database
 * so the public URLs work for Play Store review.
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

// ─── Terms & Conditions Content ───
const termsContent = `
<h2>Terms and Conditions</h2>
<p><strong>Effective Date:</strong> October 2026</p>
<p>Welcome to <strong>Food Saathi</strong>. These Terms and Conditions ("Terms") govern your use of the Food Saathi mobile application and website (collectively, the "Platform"). By accessing or using our Platform, you agree to be bound by these Terms.</p>

<h3>1. Acceptance of Terms</h3>
<p>By downloading, installing, or using the Food Saathi app, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree, please do not use the Platform.</p>

<h3>2. Services</h3>
<p>Food Saathi provides an online food ordering and delivery platform that connects customers with restaurants and delivery partners. We facilitate the ordering process but are not responsible for the preparation or quality of food provided by restaurants.</p>

<h3>3. User Accounts</h3>
<ul>
<li>You must provide accurate and complete information during registration.</li>
<li>You are responsible for maintaining the confidentiality of your account credentials.</li>
<li>You must be at least 18 years old to create an account.</li>
<li>One account per user is permitted.</li>
</ul>

<h3>4. Orders and Payments</h3>
<ul>
<li>All orders placed through the Platform are subject to acceptance by the respective restaurant.</li>
<li>Prices displayed are inclusive of applicable taxes unless stated otherwise.</li>
<li>Payment can be made through available payment methods including UPI, cards, wallets, and cash on delivery.</li>
<li>Food Saathi reserves the right to cancel orders in case of pricing errors, unavailability, or suspicious activity.</li>
</ul>

<h3>5. Delivery</h3>
<ul>
<li>Estimated delivery times are approximate and may vary based on distance, traffic, and order volume.</li>
<li>Food Saathi is not liable for delays caused by factors beyond our control.</li>
<li>Delivery charges may apply based on distance and order value.</li>
</ul>

<h3>6. Cancellations and Refunds</h3>
<ul>
<li>Orders can be cancelled before the restaurant starts preparing the food.</li>
<li>Refunds, if applicable, will be processed within 5-7 business days.</li>
<li>Food Saathi reserves the right to determine refund eligibility on a case-by-case basis.</li>
</ul>

<h3>7. User Conduct</h3>
<p>You agree not to:</p>
<ul>
<li>Use the Platform for any unlawful purpose.</li>
<li>Provide false or misleading information.</li>
<li>Interfere with the proper functioning of the Platform.</li>
<li>Harass or abuse delivery partners, restaurant staff, or other users.</li>
</ul>

<h3>8. Intellectual Property</h3>
<p>All content, trademarks, logos, and intellectual property on the Platform belong to Food Saathi or its licensors. You may not reproduce, distribute, or create derivative works without prior written consent.</p>

<h3>9. Limitation of Liability</h3>
<p>Food Saathi shall not be liable for any indirect, incidental, or consequential damages arising from the use of the Platform. Our total liability shall not exceed the amount paid by you for the specific order in question.</p>

<h3>10. Modifications</h3>
<p>Food Saathi reserves the right to modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised Terms.</p>

<h3>11. Governing Law</h3>
<p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Indore, Madhya Pradesh.</p>

<h3>12. Contact Us</h3>
<p>If you have any questions about these Terms, please contact us at:</p>
<ul>
<li><strong>Email:</strong> foodsaathi62@gmail.com</li>
<li><strong>App:</strong> Food Saathi</li>
</ul>
`;

// ─── Privacy Policy Content ───
const privacyContent = `
<h2>Privacy Policy</h2>
<p><strong>Effective Date:</strong> October 2026</p>
<p><strong>Food Saathi</strong> ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website.</p>

<h3>1. Information We Collect</h3>
<h4>a) Personal Information</h4>
<ul>
<li>Name, phone number, and email address</li>
<li>Delivery address and location data</li>
<li>Payment information (processed securely through payment gateways)</li>
</ul>

<h4>b) Usage Information</h4>
<ul>
<li>Device information (model, OS version, unique identifiers)</li>
<li>App usage data, browsing history within the app</li>
<li>Order history and preferences</li>
</ul>

<h4>c) Location Data</h4>
<ul>
<li>We collect precise location data to provide delivery services, show nearby restaurants, and calculate delivery charges.</li>
</ul>

<h3>2. How We Use Your Information</h3>
<ul>
<li>To process and deliver your food orders</li>
<li>To communicate order status and updates via notifications</li>
<li>To improve our services and user experience</li>
<li>To provide customer support</li>
<li>To send promotional offers and updates (with your consent)</li>
<li>To ensure platform safety and prevent fraud</li>
</ul>

<h3>3. Information Sharing</h3>
<p>We may share your information with:</p>
<ul>
<li><strong>Restaurant Partners:</strong> To fulfill your orders (name, delivery address, phone number).</li>
<li><strong>Delivery Partners:</strong> To deliver your orders (name, delivery address, phone number).</li>
<li><strong>Payment Processors:</strong> To process transactions securely.</li>
<li><strong>Service Providers:</strong> For analytics, cloud hosting, and communication services.</li>
</ul>
<p>We do not sell your personal information to third parties.</p>

<h3>4. Data Security</h3>
<p>We implement industry-standard security measures to protect your data, including encryption, secure servers, and access controls. However, no method of transmission over the internet is 100% secure.</p>

<h3>5. Data Retention</h3>
<p>We retain your personal information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time.</p>

<h3>6. Your Rights</h3>
<p>You have the right to:</p>
<ul>
<li>Access and review your personal information</li>
<li>Update or correct inaccurate data</li>
<li>Request deletion of your account and data</li>
<li>Opt out of promotional communications</li>
<li>Withdraw consent for location tracking</li>
</ul>

<h3>7. Cookies and Tracking</h3>
<p>We may use cookies and similar technologies to enhance your experience, analyze usage patterns, and deliver personalized content.</p>

<h3>8. Third-Party Links</h3>
<p>Our Platform may contain links to third-party websites or services. We are not responsible for their privacy practices. We encourage you to review their privacy policies.</p>

<h3>9. Children's Privacy</h3>
<p>Our Platform is not intended for children under 18 years of age. We do not knowingly collect personal information from children.</p>

<h3>10. Changes to This Policy</h3>
<p>We may update this Privacy Policy from time to time. We will notify you of significant changes through the app or via email.</p>

<h3>11. Contact Us</h3>
<p>If you have any questions or concerns about this Privacy Policy, please contact us at:</p>
<ul>
<li><strong>Email:</strong> foodsaathi62@gmail.com</li>
<li><strong>App:</strong> Food Saathi</li>
</ul>
`;

async function seedLegalPages() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('foodpagecontents');

        // Upsert Terms
        console.log('📄 Seeding Terms and Conditions...');
        await collection.updateOne(
            { key: 'terms' },
            {
                $set: {
                    key: 'terms',
                    legal: {
                        title: 'Terms and Conditions',
                        content: termsContent.trim()
                    },
                    updatedBy: null,
                    updatedByRole: 'ADMIN',
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );
        console.log('✅ Terms and Conditions added');

        // Upsert Privacy
        console.log('🔒 Seeding Privacy Policy...');
        await collection.updateOne(
            { key: 'privacy' },
            {
                $set: {
                    key: 'privacy',
                    legal: {
                        title: 'Privacy Policy',
                        content: privacyContent.trim()
                    },
                    updatedBy: null,
                    updatedByRole: 'ADMIN',
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );
        console.log('✅ Privacy Policy added');

        console.log('\n🎉 Done! Terms & Privacy pages are now live.');
        console.log('\n📌 Test these URLs:');
        console.log('   User Terms:       https://foodsaathi.in/food/user/profile/terms');
        console.log('   User Privacy:     https://foodsaathi.in/food/user/profile/privacy');
        console.log('   Restaurant Terms: https://foodsaathi.in/food/restaurant/profile/terms');
        console.log('   Restaurant Privacy: https://foodsaathi.in/food/restaurant/profile/privacy');
        console.log('   Delivery Terms:   https://foodsaathi.in/food/delivery/profile/terms');
        console.log('   Delivery Privacy: https://foodsaathi.in/food/delivery/profile/privacy');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

seedLegalPages();

