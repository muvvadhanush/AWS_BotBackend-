require("dotenv").config();
const axios = require("axios");
const { Sequelize, DataTypes } = require("sequelize");
const dbConfig = require("./config/db"); // Assuming this exports the sequelize instance

const baseURL = "http://localhost:5001/api";

// Setup separate DB connection for test setup if needed, 
// but we can just use the models if we require them.
const ConnectionKnowledge = require("./models/ConnectionKnowledge");
const Connection = require("./models/Connection");

async function runTest() {
    try {
        console.log("🧪 Starting Phase 2: Shadow Knowledge Test...");

        const connectionId = "test_phase2_" + Date.now();
        const baseURL = "http://localhost:5001/api/v1";
        const sessionId = "session_" + Date.now();

        // 1. Create Connection
        console.log("➡️ Creating Connection...");
        const authHeader = { auth: { username: "admin", password: "admin123" } };
        await axios.post(`${baseURL}/connections/create`, {
            connectionId,
            password: "test",
            websiteName: "Phase 2 Test",
            permissions: { aiEnabled: true, modes: ["FREE_CHAT"] }
        }, authHeader);

        // 2. Insert Test Knowledge (Direct DB)
        // A. SHADOW KNOWLEDGE (Should NOT be cited)
        await ConnectionKnowledge.create({
            connectionId,
            sourceType: 'TEXT',
            sourceValue: "The secret project code is OMEGA-X.",
            status: 'READY',
            visibility: 'SHADOW',
            confidenceScore: 0.5
        });
        console.log("✅ Inserted SHADOW Knowledge: 'The secret project code is OMEGA-X.'");

        // B. ACTIVE KNOWLEDGE (Should be cited)
        await ConnectionKnowledge.create({
            connectionId,
            sourceType: 'TEXT',
            sourceValue: "The public product launch is in October.",
            status: 'READY',
            visibility: 'ACTIVE',
            confidenceScore: 1.0
        });
        console.log("✅ Inserted ACTIVE Knowledge: 'The public product launch is in October.'");

        // 3. Test Question 1: Ask about Shadow Info
        console.log("\n❓ Q1: Asking about Secret Code (Shadow)...");
        const res1 = await axios.post(`${baseURL}/chat/send`, {
            connectionId,
            sessionId,
            message: "What is the secret project code?"
        });
        const reply1 = res1.data.messages[0].text;
        console.log(`🤖 AI Reply: "${reply1}"`);

        if (reply1.includes("OMEGA-X") && !reply1.toLowerCase().includes("don't have approved")) {
            console.error("❌ FAILURE: AI revealed Shadow Knowledge!");
        } else {
            console.log("✅ SUCCESS: AI refused or safely handled Shadow Knowledge.");
        }

        // 4. Test Question 2: Ask about Active Info
        console.log("\n❓ Q2: Asking about Launch Date (Active)...");
        const res2 = await axios.post(`${baseURL}/chat/send`, {
            connectionId,
            sessionId,
            message: "When is the product launch?"
        });
        const reply2 = res2.data.messages[0].text;
        console.log(`🤖 AI Reply: "${reply2}"`);

        // Check metadata regardless of answer
        const metadata = res2.data.ai_metadata;
        console.log("METADATA RECEIVED:", JSON.stringify(metadata, null, 2));

        if (reply2.includes("October")) {
            console.log("✅ SUCCESS: AI answered from Active Knowledge.");
        } else {
            console.error("❌ FAILURE: AI failed to answer from Active Knowledge.");
        }

        if (metadata && metadata.sources && metadata.sources.length > 0) {
            console.log(`✅ SUCCESS: Sources returned: ${metadata.sources.length} sources.`);
            console.log("Source 1:", metadata.sources[0].value);
        } else {
            console.error("❌ FAILURE: No sources returned for Active Answer!");
        }

        // 5. Test Question 3: Context Retrieval (Phase 2.2 Check)
        // If the prompt includes Shadow Context, it might say "I'm aware of the context but cannot answer."
        // We just verified refusal in Q1.

        console.log("\n🎉 Phase 2 Test Complete.");

    } catch (error) {
        console.error("❌ Test Failed:", error.message);
        if (error.response) console.error("Response:", error.response.data);
    }
}

runTest();
