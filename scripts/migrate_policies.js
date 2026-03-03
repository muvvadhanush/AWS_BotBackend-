require("dotenv").config({ path: "../.env" }); // Adjust path if needed, or just .env if running from root.
// Actually, running from backend dir, so .env is in root of backend.
require("dotenv").config();
const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

async function migrate() {
    try {
        console.log("📦 Starting Policy Migration...");
        const queryInterface = sequelize.getQueryInterface();

        // Check if column exists
        const tableInfo = await queryInterface.describeTable('Connections');
        if (tableInfo.policies) {
            console.log("✅ 'policies' column already exists.");
            return;
        }

        // Add Column
        // dialect is postgres, so JSONB is best. But generic JSON is fine if sqlite/mysql.
        // The project uses Postgres (per env vars seen in previous turns).
        await queryInterface.addColumn('Connections', 'policies', {
            type: DataTypes.JSON, // Sequelize maps to JSON or JSONB based on dialect
            defaultValue: [],     // Default empty array
            allowNull: true
        });

        console.log("✅ Added 'policies' column to Connections table.");

    } catch (error) {
        console.error("❌ Migration Failed:", error);
    } finally {
        await sequelize.close();
    }
}

migrate();
