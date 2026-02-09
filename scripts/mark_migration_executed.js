require('dotenv').config();
const sequelize = require('../config/db');


async function markExecuted() {
    try {
        console.log("🛠️ Marking 00_baseline.js as executed...");

        // Create SequelizeMeta if not exists
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        "name" VARCHAR(255) NOT NULL PRIMARY KEY
      );
    `);

        // Insert migration
        await sequelize.query(`
      INSERT INTO "SequelizeMeta" ("name") VALUES ('00_baseline.js')
      ON CONFLICT ("name") DO NOTHING;
    `);

        console.log("✅ Baseline migration marked as executed.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to mark migration:", err);
        process.exit(1);
    }
}

markExecuted();
