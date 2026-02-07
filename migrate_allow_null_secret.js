require("dotenv").config();
const sequelize = require("./config/db");

async function migrate() {
    try {
        console.log("🛠️ Starting connectionSecret migration...");

        await sequelize.query(`ALTER TABLE "Connections" ALTER COLUMN "connectionSecret" DROP NOT NULL;`);
        console.log("✅ Altered connectionSecret to allow NULL");

        console.log("🏁 Migration complete.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
}

migrate();
