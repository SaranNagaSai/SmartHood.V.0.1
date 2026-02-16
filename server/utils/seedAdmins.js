const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs'); // You might need to install this if not already used in AuthController, assuming simple check for now or Auth uses it

/**
 * Seed 4 specific admin accounts
 * Provide placeholders to be updated by user later
 */
const seedAdmins = async () => {
    try {
        console.log('🌱 Seeding Admin accounts...');

        // Default password for all seeded admins
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const admins = [
            {
                username: 'Saran Naga Sai',
                email: 'sarannagasait@gmail.com',
                password: hashedPassword,
                permissions: { manageUsers: true, manageAlerts: true, viewAnalytics: true, resolveComplaints: true }
            },
            {
                username: 'Rabiya Basreen',
                email: 'rabiyabasreen121212@gmail.com',
                password: hashedPassword,
                permissions: { manageUsers: true, manageAlerts: true, viewAnalytics: true, resolveComplaints: true }
            },
            {
                username: 'Sirisha',
                email: 'konasirisha65@gmail.com',
                password: hashedPassword,
                permissions: { manageUsers: true, manageAlerts: true, viewAnalytics: true, resolveComplaints: true }
            },
            {
                username: 'Revanth',
                email: 'revanthyadav0005@gmail.com',
                password: hashedPassword,
                permissions: { manageUsers: true, manageAlerts: true, viewAnalytics: true, resolveComplaints: true }
            }
        ];

        for (const adminData of admins) {
            // Check if exists
            const exists = await Admin.findOne({ $or: [{ email: adminData.email }, { username: adminData.username }] });

            if (!exists) {
                await Admin.create({
                    ...adminData,
                    isActive: true
                });
                console.log(`✅ Created admin: ${adminData.username}`);
            } else {
                console.log(`ℹ️ Admin already exists: ${adminData.username}`);
            }
        }
        console.log('✨ Admin seeding completed');

    } catch (error) {
        console.error('❌ Admin seeding failed:', error);
    }
};

module.exports = seedAdmins;
