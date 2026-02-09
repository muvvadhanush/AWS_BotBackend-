require("dotenv").config();
const axios = require("axios");
const { Sequelize } = require("sequelize");
const dbConfig = require("./config/db");
const ConnectionKnowledge = require("./models/ConnectionKnowledge");
const ChatSession = require("./models/ChatSession");

const baseURL = "http://localhost:5001/api";

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

async function runTest() {
    try {
        console.log("🧪 Starting Audit & Feedback Test...");

        const connectionId = "test_feedback_" + Date.now();
        const sessionId = "session_fb_" + Date.now();

        // 1. Create Connection
        await axios.post(`${baseURL}/connections/create`, {
            connectionId,
            password: "test",
            websiteName: "Feedback Test",
            permissions: { aiEnabled: true, modes: ["FREE_CHAT"] }
        });

        // 2. Insert Active Knowledge
        const knowledge = await ConnectionKnowledge.create({
            connectionId,
            sourceType: 'TEXT',
            sourceValue: "The feedback loop is working.",
            status: 'READY',
            visibility: 'ACTIVE',
            confidenceScore: 0.5
        });
        const sourceId = knowledge.id;
        console.log(`✅ Created Knowledge (ID: ${sourceId}, Score: 0.5)`);

        // 3. Send Chat Message
        console.log("➡️ Sending Chat Message...");
        const res = await axios.post(`${baseURL}/chat/send`, {
            connectionId,
            sessionId,
            message: "Is the feedback loop working?"
        }, { timeout: 15000 }); // 15s timeout

        console.log(`✅ Message Sent. Status: ${res.status}`);

        // 4. Verify AI Metadata in Response
        const metadata = res.data.ai_metadata;
        if (metadata && metadata.sources && metadata.sources.length > 0) {
            console.log("✅ Chat returned sources metadata.");
        } else {
            console.error("❌ Chat did NOT return sources (Wait, did AI refuse?).");
            // If AI refused, we can't test feedback on sources. Check reply.
            console.log("Reply:", res.data.messages[0].text);
        }

        // 5. Verify Metadata Persistence in DB (Audit Log)
        const session = await ChatSession.findOne({ where: { sessionId } });
        const lastMsg = session.messages[session.messages.length - 1]; // Assistant reply

        if (lastMsg.ai_metadata && lastMsg.ai_metadata.sources) {
            console.log("✅ Audit Log Verified: Metadata saved in ChatSession.");
        } else {
            console.error("❌ Audit Log Failed: Metadata NOT saved in DB.");
            console.log("Saved Message:", JSON.stringify(lastMsg, null, 2));
        }

        // 6. Send Feedback (CORRECT)
        console.log("➡️ Sending Positive Feedback...");
        // Index is 1 (User=0, Assistant=1)
        const fbRes = await axios.post(`${baseURL}/admin/chat-sessions/${sessionId}/messages/1/feedback`, {
            rating: "CORRECT",
            notes: "Great answer!"
        });
        console.log("Feedback Response:", fbRes.data);

        // 7. Verify Message update
        await session.reload();
        const updatedMsg = session.messages[1];
        if (updatedMsg.feedback && updatedMsg.feedback.rating === 'CORRECT') {
            console.log("✅ Message Feedback Updated.");
        } else {
            console.error("❌ Message Feedback NOT Updated.");
        }

        // 8. Verify Confidence Score Boost
        await knowledge.reload();
        console.log(`New Confidence Score: ${knowledge.confidenceScore}`);
        if (knowledge.confidenceScore > 0.5) {
            console.log("✅ Confidence Score Boosted!");
        } else {
            console.error("❌ Confidence Score NOT Boosted.");
        }

    } catch (error) {
        console.error("❌ Test Failed:", error.message);
        if (error.response) console.error("Response:", error.response.data);
    }
}

runTest();
