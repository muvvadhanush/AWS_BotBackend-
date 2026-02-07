require("dotenv").config();
const sequelize = require("./config/db");

async function migrate() {
    try {
        console.log("🛠️ Starting Phase 1.7 migration...");

        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "PendingExtractions" (
                "id" UUID PRIMARY KEY,
                "connectionId" VARCHAR(255) NOT NULL,
                "source" VARCHAR(255) DEFAULT 'WIDGET',
                "extractorType" VARCHAR(255) NOT NULL,
                "rawData" JSONB NOT NULL,
                "pageUrl" VARCHAR(255),
                "status" VARCHAR(255) DEFAULT 'PENDING',
                "reviewedBy" VARCHAR(255),
                "reviewedAt" TIMESTAMPTZ,
                "reviewNotes" TEXT,
                "createdAt" TIMESTAMPTZ NOT NULL,
                "updatedAt" TIMESTAMPTZ NOT NULL
            );
        `);
        console.log("✅ Created PendingExtractions table");

        console.log("🏁 Phase 1.7 Migration complete.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
}

migrate();
