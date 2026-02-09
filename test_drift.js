require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");

const baseURL = "http://localhost:5001/api/v1";
const users = {
    owner: { auth: { username: "admin", password: "admin123" } },
    editor: { auth: { username: "editor", password: "editor123" } }
};

const connectionId = "drift_test_conn";
const testUrl = "http://example.com";

async function test() {
    console.log("🌊 Starting Drift Detection Tests...");

    try {
        // 0. Create Connection (As OWNER)
        console.log("\n--- Step 0: Create Connection ---");
        try {
            await axios.post(`${baseURL}/connections/create`, {
                connectionId,
                websiteName: "Drift Test"
            }, users.owner);
            console.log("✅ Created Connection");
        } catch (e) {
            console.log("ℹ️ Connection might already exist:", e.message);
        }

        // 1. Ingest Content (As EDITOR)
        console.log("\n--- Step 1: Ingest Initial Content ---");
        const initialText = "This is the original content."; // not used for URL

        console.log("Ingesting http://example.com ...");
        const ingestRes = await axios.post(`${baseURL}/connections/${connectionId}/knowledge/ingest`, {
            sourceType: "URL",
            sourceValue: "http://example.com"
        }, users.editor);

        console.log("✅ Ingested response:", ingestRes.data);

        // 2. Get the Knowledge to see the Hash
        const res = await axios.get(`${baseURL}/connections/${connectionId}/details`, users.editor);
        const knowledge = res.data.ConnectionKnowledges.find(k => k.sourceValue === "http://example.com");

        if (!knowledge) throw new Error("Knowledge not found after ingest");

        const storedHash = knowledge.contentHash;
        console.log(`Stored Hash: ${storedHash}`);

        // 3. Drift Check - SYNCED
        console.log("\n--- Step 2: Check SYNCED (Same Hash) ---");
        const check1 = await axios.post(`${baseURL}/connections/${connectionId}/drift-check`, {
            url: "http://example.com",
            currentHash: storedHash
        });
        console.log("Response:", check1.data);
        if (check1.data.status !== 'synced') console.error("❌ Should be synced!");
        else console.log("✅ Correctly identified as SYNCED");

        // 4. Drift Check - DRIFTED
        console.log("\n--- Step 3: Check DRIFTED (Diff Hash) ---");
        const fakeHash = "abc1234567890abcdef1234567890abc";
        const check2 = await axios.post(`${baseURL}/connections/${connectionId}/drift-check`, {
            url: "http://example.com",
            currentHash: fakeHash
        });
        console.log("Response:", check2.data);
        if (check2.data.status !== 'drifted') console.error("❌ Should be drifted!");
        else console.log("✅ Correctly identified as DRIFTED");

        // 5. Verify DB Status
        console.log("\n--- Step 4: Verify DB Status is STALE ---");
        const res2 = await axios.get(`${baseURL}/connections/${connectionId}/details`, users.editor);
        const knowledge2 = res2.data.ConnectionKnowledges.find(k => k.sourceValue === "http://example.com");
        console.log(`Status: ${knowledge2.status}`);

        if (knowledge2.status === 'STALE') console.log("✅ Database updated to STALE");
        else console.error("❌ Database status mismatch");

    } catch (error) {
        console.error("Test Error:", error.message);
        if (error.response) console.error(error.response.data);
    }
}

test();
