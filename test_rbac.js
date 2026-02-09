require("dotenv").config();
const axios = require("axios");

const baseURL = "http://localhost:5001/api/v1";

const users = {
    owner: { auth: { username: "admin", password: "admin123" } },
    editor: { auth: { username: "editor", password: "editor123" } },
    viewer: { auth: { username: "viewer", password: "viewer123" } },
    invalid: { auth: { username: "admin", password: "wrongpassword" } }
};

const connectionId = "rbac_test_conn";

async function test() {
    console.log("🔒 Starting RBAC Verification Tests...");

    try {
        // 1. OWNER can CREATE
        console.log("\n--- Test 1: OWNER Create Connection ---");
        try {
            await axios.post(`${baseURL}/connections/create`, {
                connectionId,
                websiteName: "RBAC Test"
            }, users.owner);
            console.log("✅ OWNER Created Connection (Allowed)");
        } catch (e) {
            console.error("❌ OWNER Check Failed:", e.message);
        }

        // 2. VIEWER cannot CREATE
        console.log("\n--- Test 2: VIEWER Create Connection ---");
        try {
            await axios.post(`${baseURL}/connections/create`, {
                connectionId: "fail_conn",
                websiteName: "Should Fail"
            }, users.viewer);
            console.error("❌ VIEWER Created Connection (Should have failed!)");
        } catch (e) {
            if (e.response && e.response.status === 403) {
                console.log("✅ VIEWER Rejected (403 Correct)");
            } else {
                console.error(`❌ VIEWER Failed with wrong status: ${e.response?.status}`);
            }
        }

        // 3. EDITOR can INGEST
        console.log("\n--- Test 3: EDITOR Ingest Knowledge ---");
        try {
            await axios.post(`${baseURL}/connections/${connectionId}/knowledge/ingest`, {
                sourceType: "TEXT",
                sourceValue: "RBAC Content"
            }, users.editor);
            console.log("✅ EDITOR Ingested (Allowed)");
        } catch (e) {
            console.error("❌ EDITOR Check Failed:", e.message);
            if (e.response) console.error(e.response.data);
        }

        // 4. VIEWER cannot INGEST
        console.log("\n--- Test 4: VIEWER Ingest Knowledge ---");
        try {
            await axios.post(`${baseURL}/connections/${connectionId}/knowledge/ingest`, {
                sourceType: "TEXT",
                sourceValue: "Viewer Content"
            }, users.viewer);
            console.error("❌ VIEWER Ingested (Should have failed!)");
        } catch (e) {
            if (e.response && e.response.status === 403) {
                console.log("✅ VIEWER Rejected (403 Correct)");
            } else {
                console.error(`❌ VIEWER Failed with wrong status: ${e.response?.status}`);
            }
        }

        // 5. VIEWER can LIST
        console.log("\n--- Test 5: VIEWER List Connections ---");
        try {
            console.log("Sending GET request to /connections/list...");
            const res = await axios.get(`${baseURL}/connections/list`, users.viewer);
            console.log("Response received:", res.status);
            console.log("✅ VIEWER Listed (Allowed)");
        } catch (e) {
            console.error("❌ VIEWER Check Failed:", e.message);
            if (e.response) console.error("Data:", e.response.data);
        }

        // 6. INVALID Auth
        console.log("\n--- Test 6: Invalid Credentials ---");
        try {
            await axios.get(`${baseURL}/connections/list`, users.invalid);
            console.error("❌ Invalid User Accessed (Should have failed!)");
        } catch (e) {
            if (e.response && e.response.status === 401) {
                console.log("✅ Invalid Creds Rejected (401 Correct)");
            } else {
                console.error(`❌ Failed with wrong status: ${e.response?.status}`);
            }
        }

        console.log("\n🎉 RBAC Verification Complete.");

    } catch (error) {
        console.error("Test Suite Error:", error.message);
    }
}

test();
