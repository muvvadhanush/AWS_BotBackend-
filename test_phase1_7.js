const axios = require("axios");
const baseURL = "http://localhost:5001/api";

async function runTest() {
    try {
        console.log("🧪 Starting Phase 1.7 Test...");

        const connectionId = "test_conn_17_" + Date.now();
        const password = "myselectsecret";

        // 1. Create Connection
        console.log("➡️ Creating Connection...");
        await axios.post(`${baseURL}/connections/create`, {
            connectionId,
            password: password,
            websiteName: "Test Site Phase 1.7"
        });

        // 2. Widget Handshake & Enable Extraction
        const helloRes = await axios.post(`${baseURL}/widget/hello`, {
            connectionId,
            password: password,
            origin: "http://test.com"
        });

        await axios.post(`${baseURL}/connections/${connectionId}/extraction/enable`, {});

        // 3. Trigger Extraction
        const triggerRes = await axios.post(`${baseURL}/connections/${connectionId}/extract`);
        const token = triggerRes.data.token;
        console.log("✅ Extraction Triggered. Token:", token);

        // 4. Widget Submit Extraction (New PendingExtraction Logic)
        console.log("➡️ Widget Submit (Pending)...");
        await axios.post(`${baseURL}/widget/extract`, {
            connectionId,
            token,
            data: {
                siteName: "Pending Approval Site",
                knowledge: [
                    { type: "text", text: "Pending Knowledge", title: "Pending Doc" }
                ],
                navigation: [
                    { label: "Login", action: "click", selector: "#login-btn" }
                ]
            }
        });
        console.log("✅ Widget Submitted Data");

        // 5. Admin List Pending
        console.log("➡️ Admin Fetch Pending...");
        const pendingRes = await axios.get(`${baseURL}/admin/connections/${connectionId}/extractions?status=PENDING`);
        const pendingItems = pendingRes.data;
        console.log(`✅ Found ${pendingItems.length} pending items.`);

        if (pendingItems.length === 0) throw new Error("No pending items found!");

        // 6. Admin Approve (Metadata)
        const metadataItem = pendingItems.find(i => i.extractorType === 'METADATA');
        if (metadataItem) {
            console.log("➡️ Approving Metadata...");
            const reviewRes = await axios.post(`${baseURL}/admin/extractions/${metadataItem.id}/review`, {
                action: "APPROVE",
                notes: "Looks good"
            });
            console.log("✅ Approved Metadata:", reviewRes.data);
        }

        // 7. Admin Approve (Knowledge)
        const knowledgeItem = pendingItems.find(i => i.extractorType === 'KNOWLEDGE');
        if (knowledgeItem) {
            console.log("➡️ Approving Knowledge...");
            const reviewRes = await axios.post(`${baseURL}/admin/extractions/${knowledgeItem.id}/review`, {
                action: "APPROVE",
                notes: "Valid knowledge"
            });
            console.log("✅ Approved Knowledge:", reviewRes.data);
        }

        // 8. Admin Reject (Navigation - just test rejection)
        const navItem = pendingItems.find(i => i.extractorType === 'NAVIGATION');
        if (navItem) {
            console.log("➡️ Rejecting Navigation...");
            const reviewRes = await axios.post(`${baseURL}/admin/extractions/${navItem.id}/review`, {
                action: "REJECT",
                notes: "Not needed yet"
            });
            console.log("✅ Rejected Navigation:", reviewRes.data);
        }

        console.log("🎉 POST-TEST SUCCESS!");

    } catch (error) {
        console.error("❌ Test Failed:", error.message);
        if (error.response) {
            console.error("Response:", error.response.data);
        }
    }
}

runTest();
