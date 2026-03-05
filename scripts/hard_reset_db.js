require("dotenv").config();
const sequelize = require("../config/db");

// Import all models to ensure they are registered with Sequelize
require("../models/Connection");
require("../models/User");
require("../models/ChatSession");
require("../models/Idea");
require("../models/KnowledgeCategory");
require("../models/KnowledgeCoverage");
require("../models/ManualUpload");
require("../models/PageContent");
require("../models/PendingExtraction");
require("../models/BehaviorConfig");
require("../models/BehaviorMetrics");
require("../models/BehaviorSuggestion");
require("../models/BrandDriftLog");
require("../models/ConfidencePolicy");
require("../models/ConnectionBrandProfile");
require("../models/ConnectionCrawlSession");
require("../models/ConnectionDiscovery");
require("../models/ConnectionKnowledge");

async function hardReset() {
    try {
        console.log("⚠️ WARNING: This will DROP all tables and delete ALL data.");
        console.log("Connecting to database...");

        await sequelize.authenticate();
        console.log("✅ Authenticated successfully.");

        // The force: true option drops tables and recreates them
        console.log("🔄 Dropping all tables and recreating schema...");
        await sequelize.sync({ force: true });

        console.log("✅ Schema successfully recreated. All data has been wiped.");
        console.log("You can now safely run the server or create new connections.");

    } catch (error) {
        console.error("❌ Error during hard reset:", error);
    } finally {
        console.log("Closing connection...");
        await sequelize.close();
        process.exit(0);
    }
}

hardReset();
