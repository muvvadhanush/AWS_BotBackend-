require("dotenv").config();
const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

async function migrate() {
    const queryInterface = sequelize.getQueryInterface();
    const table = "ConnectionKnowledges";

    try {
        console.log("Adding contentHash column...");
        await queryInterface.addColumn(table, "contentHash", {
            type: DataTypes.STRING,
            allowNull: true
        });
        console.log("✅ Added contentHash");

        console.log("Adding lastCheckedAt column...");
        await queryInterface.addColumn(table, "lastCheckedAt", {
            type: DataTypes.DATE,
            allowNull: true
        });
        console.log("✅ Added lastCheckedAt");

    } catch (error) {
        console.error("Migration Error:", error.message);
    } finally {
        await sequelize.close();
    }
}

migrate();
