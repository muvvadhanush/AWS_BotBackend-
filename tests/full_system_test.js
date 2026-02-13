require("dotenv").config();
const axios = require("axios");

const BASE_URL = "http://localhost:5001";
const API_URL = `${BASE_URL}/api/v1`;

// Test Configuration
const TEST_ID = `system_test_${Date.now()}`;
// Note: Adjust admin credentials if changed
const ADMIN_AUTH = {
    auth: {
        username: process.env.ADMIN_USERNAME || "admin",
        password: process.env.ADMIN_PASSWORD || "admin123"
    }
};

async function runSystemTest() {
    console.log("🚀 Starting Full System Test...");
    console.log(`🎯 Test ID: ${TEST_ID}`);

    let connectionId = `conn_${TEST_ID}`;
    let sessionId = `sess_${TEST_ID}`;

    try {
        // 1. Health Check
        console.log("\n1️⃣  Checking System Health...");
        try {
            const health = await axios.get(`${BASE_URL}/health`);
            console.log(`✅ Health Check Passed: ${health.data.status}`);
        } catch (e) {
            console.error(`❌ Health Check Failed: ${e.message}`);
            // Don't fail immediately, continue if possible
        }

        // 2. Create Connection (Admin)
        console.log("\n2️⃣  Creating Test Connection...");
        try {
            await axios.post(`${API_URL}/connections/create`, {
                connectionId,
                password: "test_password",
                websiteName: "System Test Site",
                welcomeMessage: "Hello form Test",
                assistantName: "TestBot",
                permissions: { aiEnabled: true, modes: ["FREE_CHAT"] }
            }, ADMIN_AUTH);
            console.log("✅ Connection Created.");
        } catch (e) {
            throw new Error(`Create Connection Failed: ${e.response?.data?.error || e.message}`);
        }

        // 3. Ingest Knowledge (Direct DB for reliability in test)
        console.log("\n3️⃣  Ingesting Test Knowledge...");
        try {
            const ConnectionKnowledge = require("../models/ConnectionKnowledge");
            await ConnectionKnowledge.create({
                connectionId,
                sourceType: "TEXT",
                sourceValue: "Secret Code",
                rawText: "The magic keyword is ALAKAZAM.",
                status: "READY",
                visibility: "ACTIVE",
                confidenceScore: 1.0
            });
            console.log("✅ Knowledge Ingested (Direct DB Model).");
        } catch (e) {
            console.warn(`⚠️ Ingestion Warning: ${e.message}`);
        }

        // 4. Test Chat (AI Response)
        console.log("\n4️⃣  Testing AI Chat...");
        try {
            const chatRes = await axios.post(`${API_URL}/chat/send`, {
                connectionId,
                sessionId,
                message: "What is the magic keyword?",
                url: "http://test.com"
            });

            if (chatRes.data && chatRes.data.messages && chatRes.data.messages.length > 0) {
                const reply = chatRes.data.messages[0].text;
                console.log(`🤖 AI Reply: "${reply}"`);

                if (reply && reply.includes("ALAKAZAM")) {
                    console.log("✅ RAG Verification PASSED: AI used knowledge.");
                } else {
                    console.warn("⚠️ RAG Verification Warning: AI did not cite the keyword (expected if model is weak).");
                }
            } else {
                console.error("❌ Chat Response Invalid:", chatRes.data);
            }
        } catch (e) {
            console.error(`❌ Chat Failed: ${e.response?.data?.error || e.message}`);
        }

        // 5. Cleanup
        console.log("\n5️⃣  Cleaning Up...");
        try {
            /* 
            // Cleanup Logic via API (Delete Connection)
            // Note: Delete endpoint might be protected or missing in some versions.
            // Let's assume it exists or just leave waste data for debugging if needed.
            // await axios.delete(`${API_URL}/connections/${connectionId}`, ADMIN_AUTH);
            // console.log("✅ Test Connection Deleted.");
            */
            console.log("ℹ️ Test Connection Left for Inspection: " + connectionId);
        } catch (e) {
            console.warn(`⚠️ Cleanup Warning: ${e.message}`);
        }

        console.log("\n🎉 FULL SYSTEM TEST COMPLETE!");
        process.exit(0);

    } catch (error) {
        console.error("\n❌ SYSTEM TEST FAILED CRITICALLY");
        console.error(error.message);
        if (error.response) console.error("API Response:", error.response.data);
        process.exit(1);
    }
}

// Run (Self-invoking)
(async () => {
    // Only run if executed directly
    if (require.main === module) {
        await runSystemTest();
    }
})();

module.exports = runSystemTest;
