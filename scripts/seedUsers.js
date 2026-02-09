require("dotenv").config();
const sequelize = require("../config/db");
const User = require("../models/User");

async function seed() {
    try {
        await sequelize.authenticate();
        await sequelize.sync(); // Ensure table exists

        const users = [
            { username: "admin", passwordHash: "admin123", role: "OWNER" },
            { username: "editor", passwordHash: "editor123", role: "EDITOR" },
            { username: "viewer", passwordHash: "viewer123", role: "VIEWER" }
        ];

        for (const u of users) {
            const [user, created] = await User.findOrCreate({
                where: { username: u.username },
                defaults: u
            });

            if (created) {
                console.log(`✅ Created user: ${u.username} (${u.role})`);
            } else {
                console.log(`ℹ️ User exists: ${u.username}`);
            }
        }

    } catch (e) {
        console.error("❌ Seeding failed:", e);
    } finally {
        await sequelize.close();
    }
}

seed();
