const axios = require("axios");

async function testLegacy() {
    console.log("🕰️ Testing Legacy API (Expect 410 Gone)...");
    try {
        await axios.post("http://localhost:5001/api/chat/send", {
            message: "Hello"
        });
        console.error("❌ Legacy API should have failed but succeeded!");
    } catch (e) {
        if (e.response && e.response.status === 410) {
            console.log("✅ Legacy API returned 410 Gone (Correct)");
            console.log("Message:", e.response.data);
        } else {
            console.error("❌ Legacy API failed with wrong status:", e.response ? e.response.status : e.message);
        }
    }
}

testLegacy();
