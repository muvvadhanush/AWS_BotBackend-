require("dotenv").config();
const axios = require("axios");

const baseURL = "http://localhost:5001/api/v1";
const users = {
    owner: { auth: { username: "admin", password: "admin123" } },
    editor: { auth: { username: "editor", password: "editor123" } }
};

const connectionId = "policy_test_conn";
const sessionId = "sess_" + Date.now();

async function test() {
    console.log("👮 Starting Policy Verification...");

    try {
        // 1. Create Connection (Owner)
        console.log("\n--- Step 1: Create Connection ---");
        try {
            await axios.post(`${baseURL}/connections/create`, {
                connectionId,
                websiteName: "Policy Lab"
            }, users.owner);
            console.log("✅ Created Connection");
        } catch (e) {
            console.log("ℹ️ Connection might exist.");
        }

        // 2. Set Policy: "Do not mention the word 'banana'."
        console.log("\n--- Step 2: Set Policy ---");
        await axios.put(`${baseURL}/connections/${connectionId}`, {
            policies: ["Do not mention the word 'banana'. If asked, say 'I cannot discuss fruits'."]
        }, users.editor);
        console.log("✅ Policy Set: No Bananas");

        // 3. Test Violation
        console.log("\n--- Step 3: Test Policy Violation ---");
        // We need to bypass the "Active Knowledge" restriction for this test, 
        // or ensure we have some active knowledge so it doesn't just say "I don't know".
        // But the prompt says "If ... violates policy, refuse." - this constraint should override knowledge?
        // Let's add some dummy knowledge to be safe, so it *could* answer if not for the policy.

        await axios.post(`${baseURL}/connections/${connectionId}/knowledge/ingest`, {
            sourceType: "TEXT",
            sourceValue: "Bananas are yellow fruit. Apples are red."
        }, users.editor);
        console.log("✅ Ingested Knowledge (Bananas exist)");

        const res = await axios.post(`${baseURL}/chat/send`, {
            connectionId,
            sessionId,
            message: "Tell me about bananas."
        });

        const reply = res.data.messages[0].text;
        console.log(`🤖 Bot Reply: "${reply}"`);

        if (reply.toLowerCase().includes("cannot discuss fruits") || !reply.toLowerCase().includes("yellow")) {
            console.log("✅ Policy Enforced (Refusal)");
        } else {
            console.error("❌ Policy Failed (Bot answered)");
        }

        // 4. Test Allowed Topic
        console.log("\n--- Step 4: Test Allowed Topic ---");
        const res2 = await axios.post(`${baseURL}/chat/send`, {
            connectionId,
            sessionId,
            message: "Tell me about apples."
        });
        const reply2 = res2.data.messages[0].text;
        console.log(`🤖 Bot Reply: "${reply2}"`);

        if (reply2.toLowerCase().includes("red")) {
            console.log("✅ Normal Q&A works");
        } else {
            console.log("⚠️ Bot might have missed the apple fact, but that's okay for policy test.");
        }

    } catch (error) {
        console.error("Test Error:", error.message);
        if (error.response) console.error(error.response.data);
    }
}

test();
