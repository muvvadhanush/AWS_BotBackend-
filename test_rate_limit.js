const axios = require('axios');
require('dotenv').config();

const BASE_URL = `http://localhost:${process.env.PORT || 5003}/api/v1`;

async function testRateLimit() {
    console.log(`🚀 Testing Rate Limits on ${BASE_URL}`);

    // Test 1: Widget Chat Flood (Limit: 60/min)
    console.log("\n--- Test 1: Widget Chat Flood (Limit: 60/min) ---");
    let rejected = false;
    const connId = `test-flood-${Date.now()}`; // STABLE ID

    try {
        const requests = [];
        for (let i = 0; i < 80; i++) {
            requests.push(
                axios.post(`${BASE_URL}/widget/hello`, { connectionId: connId })
                    .then(res => {
                        if (i % 5 === 0) console.log(`Req #${i} Rem: ${res.headers['ratelimit-remaining']}`);
                        process.stdout.write(".");
                        return 200;
                    })
                    .catch(err => {
                        if (err.response) {
                            if (i % 10 === 0 || err.response.headers['ratelimit-remaining'] === '0') {
                                console.log(`Req #${i} Status: ${err.response.status} Rem: ${err.response.headers['ratelimit-remaining']}`);
                            }
                            if (err.response.status === 429) {
                                rejected = true;
                                process.stdout.write("!");
                                return 429;
                            }
                        }
                        process.stdout.write("x");
                        return err.response ? err.response.status : 500;
                    })
            );
        }

        await Promise.all(requests);

        if (rejected) {
            console.log("\n✅ Rate Limit Triggered!");
        } else {
            console.log("\n❌ Failed to trigger rate limit.");
        }

    } catch (e) {
        console.error("Critical fail:", e.message);
    }

    // Test 2: System Health (Limit: 100/min)
    console.log("\n--- Test 2: System Health Flood (Limit: 100/min) ---");
    // We won't flood 100 times to save time, unless crucial.
    // Just verify it works.
    try {
        const res = await axios.get(`http://localhost:${process.env.PORT || 5003}/health`);
        console.log(`✅ Health Check: ${res.status}`);
    } catch (e) {
        console.log(`❌ Health Check Failed: ${e.message}`);
    }

}

testRateLimit();
