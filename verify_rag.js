const { retrieveKnowledge } = require('./services/aiservice');
const { generateEmbedding } = require('./services/embeddingService');
const ConnectionKnowledge = require('./models/ConnectionKnowledge');
const Connection = require('./models/Connection');
const { v4: uuidv4 } = require('uuid');

async function testRAG() {
    const testId = 'test_' + Date.now();
    console.log(`🧪 Starting RAG Verification [${testId}]...`);

    try {
        // 1. Create Test Connection
        await Connection.create({
            connectionId: testId,
            websiteName: "Test Site",
            status: "CONNECTED"
        });

        // 2. Ingest Sample Data
        const sampleText = "The company's primary office is located in the Emerald City, 123 Wizard Way. It was founded in 1939.";
        const embedding = await generateEmbedding(sampleText);

        await ConnectionKnowledge.create({
            connectionId: testId,
            sourceType: 'TEXT',
            sourceValue: 'Office Location',
            rawText: sampleText,
            cleanedText: sampleText,
            embedding: JSON.stringify(embedding),
            status: 'READY',
            visibility: 'ACTIVE',
            confidenceScore: 1.0,
            contentHash: 'hash123'
        });

        console.log("✅ Sample data ingested with embedding.");

        // 3. Test Retrieval (Semantic)
        const query = "Where is the main office?";
        console.log(`🔍 Testing retrieval for: "${query}"`);

        const results = await retrieveKnowledge(testId, query);

        if (results.active.length > 0) {
            console.log("✅ Retrieval Success!");
            console.log("TOP MATCH:", results.active[0].sourceValue);
            console.log("SCORE:", results.active[0].finalScore);
            console.log("VECTOR SCORE:", results.active[0].vectorScore);
        } else {
            console.error("❌ Retrieval Failed: No matches found.");
        }

        // Cleanup
        await ConnectionKnowledge.destroy({ where: { connectionId: testId } });
        await Connection.destroy({ where: { connectionId: testId } });
        console.log("🧹 Cleanup complete.");

    } catch (e) {
        console.error("❌ Test Failed:", e.message);
    }
}

testRAG();
