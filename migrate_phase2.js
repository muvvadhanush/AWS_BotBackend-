require("dotenv").config();
const sequelize = require("./config/db");

async function migrate() {
    try {
        console.log("🛠️ Starting Phase 2 migration...");

        // ConnectionKnowledge updates
        await sequelize.query(`ALTER TABLE "ConnectionKnowledges" ADD COLUMN IF NOT EXISTS "visibility" VARCHAR(255) DEFAULT 'SHADOW';`);
        console.log("✅ Added visibility to ConnectionKnowledges");

        await sequelize.query(`ALTER TABLE "ConnectionKnowledges" ADD COLUMN IF NOT EXISTS "confidenceScore" FLOAT DEFAULT 0.5;`);
        console.log("✅ Added confidenceScore to ConnectionKnowledges");

        // PendingExtraction updates
        await sequelize.query(`ALTER TABLE "PendingExtractions" ADD COLUMN IF NOT EXISTS "triggerQueries" JSONB DEFAULT '[]';`);
        console.log("✅ Added triggerQueries to PendingExtractions");

        await sequelize.query(`ALTER TABLE "PendingExtractions" ADD COLUMN IF NOT EXISTS "relevanceScore" FLOAT DEFAULT 0.0;`);
        console.log("✅ Added relevanceScore to PendingExtractions");

        console.log("🏁 Phase 2 Migration complete.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
}

migrate();
