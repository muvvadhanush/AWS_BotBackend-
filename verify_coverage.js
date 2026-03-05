const { categorizePage, updateCoverage } = require("./services/knowledge/coverageService");
const Connection = require("./models/Connection");
const ConnectionDiscovery = require("./models/ConnectionDiscovery");
const PageContent = require("./models/PageContent");

async function testCoverage() {
    const testId = "cvg_" + Date.now();
    console.log(`🧪 Starting Coverage Verification [${testId}]...`);

    try {
        // 1. Create Connection
        await Connection.create({ connectionId: testId, websiteName: "CVG Test" });

        // 2. Discover 10 pages
        for (let i = 1; i <= 10; i++) {
            await ConnectionDiscovery.create({
                connectionId: testId,
                discoveredUrl: `https://test.com/page${i}`,
                sourceType: 'CRAWLER',
                status: (i <= 4) ? 'INDEXED' : 'DISCOVERED' // 40% coverage
            });
        }

        // 3. Create PageContent for 'Pricing' (Critical)
        await PageContent.create({
            connectionId: testId,
            url: "https://test.com/pricing",
            title: "Pricing Plans",
            category: categorizePage("https://test.com/pricing", "Pricing Plans"),
            cleanText: "Basic, Pro, Enterprise plans available.",
            status: 'FETCHED'
        });

        console.log("✅ Mock discovery and content created.");

        // 4. Run Update
        const result = await updateCoverage(testId);

        console.log("\n--- Coverage Report ---");
        console.log("TOTAL DISCOVERED:", result.totalDiscoveredPages);
        console.log("INDEXED:", result.indexedPages);
        console.log("COVERAGE SCORE:", (result.coverageScore * 100).toFixed(1) + "%");
        console.log("CRITICAL SCORE:", (result.criticalCoverageScore * 100).toFixed(1) + "%");
        console.log("RISK LEVEL:", result.riskLevel);

        // Verification
        if (result.totalDiscoveredPages >= 10 && result.criticalCoverageScore > 0) {
            console.log("\n✅ [PASS] Logic correctly detected critical content and calculated scores.");
        } else {
            console.error("\n❌ [FAIL] Numbers mismatch.");
        }

        // Cleanup
        await ConnectionDiscovery.destroy({ where: { connectionId: testId } });
        await PageContent.destroy({ where: { connectionId: testId } });
        await Connection.destroy({ where: { connectionId: testId } });
        console.log("🧹 Cleanup complete.");

    } catch (e) {
        console.error("❌ Test Failed:", e.message);
    }
}

testCoverage();
