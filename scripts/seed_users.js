require("dotenv").config({ path: "../.env" });
require("dotenv").config();
const sequelize = require('../config/db');
const User = require('../models/User');

async function seed() {
    try {
        console.log("🌱 Seeding Users...");
        await sequelize.sync(); // Ensure table exists

        const users = [
            { username: "admin", passwordHash: "admin123", role: "OWNER" },
            { username: "editor", passwordHash: "editor123", role: "EDITOR" },
            { username: "viewer", passwordHash: "viewer123", role: "VIEWER" }
        ];

        for (const u of users) {
            // We can't use findOrCreate easily with the hook efficiently if checking existing password, 
            // but here we just want to ensure they exist.
            // If we use findOrCreate, it defaults to the 'defaults' only if not found.
            const [user, created] = await User.findOrCreate({
                where: { username: u.username },
                defaults: {
                    username: u.username,
                    passwordHash: u.passwordHash,
                    role: u.role
                }
            });

            if (created) {
                console.log(`✅ Created user: ${u.username}`);
            } else {
                console.log(`ℹ️ User already exists: ${u.username}`);
                // Check if we need to update password (if we really wanted to force reset)
                // But for now, let's assume if they exist, they are good.
                // Or update them to ensure test_rbac works:
                user.passwordHash = u.passwordHash;
                user.role = u.role;
                await user.save(); // Hooks will run to hash password
                console.log(`🔄 Updated user: ${u.username}`);
            }
        }

    } catch (error) {
        console.error("❌ Seed Failed:", error);
    } finally {
        await sequelize.close();
    }
}

seed();
