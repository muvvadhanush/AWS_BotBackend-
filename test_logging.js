const axios = require("axios");

const BASE_URL = "http://localhost:5003/api/v1";

(async () => {
    try {
        console.log("🚀 Testing Observability...");

        // 1. Successful Request
        console.log("1. Sending Health Check...");
        const res1 = await axios.get("http://localhost:5003/health");
        console.log("   Status:", res1.status);
        console.log("   X-Request-ID:", res1.headers['x-request-id'] || "MISSING");

        // 2. Error Request (404)
        console.log("\n2. Sending 404 Request...");
        try {
            await axios.get("http://localhost:5003/api/v1/missing-route");
        } catch (err) {
            console.log("   Status:", err.response ? err.response.status : err.message);
            console.log("   X-Request-ID:", err.response ? err.response.headers['x-request-id'] : "MISSING");
            console.log("   Error Body:", JSON.stringify(err.response ? err.response.data : {}));
        }

    } catch (e) {
        console.error("Test failed:", e.message);
        if (e.response) {
            console.error("Response Status:", e.response.status);
            console.error("Response Data:", JSON.stringify(e.response.data));
        }
    }
})();
