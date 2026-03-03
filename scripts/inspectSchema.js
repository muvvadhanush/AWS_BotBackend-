require("dotenv").config();
const sequelize = require("../config/db");

async function check() {
    try {
        const table = await sequelize.getQueryInterface().describeTable("ConnectionKnowledges");
        console.log("Columns:", Object.keys(table));
    } catch (e) {
        console.error("Error:", e.message);
    }
}

check();
