const sequelize = require('./config/db');

async function migrate() {
    try {
        console.log("🚀 Enabling Vector Extension...");
        await sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;');

        console.log("🏗️ Adding vector(1536) column to ConnectionKnowledges...");
        await sequelize.query(`
            ALTER TABLE "ConnectionKnowledges" 
            ADD COLUMN IF NOT EXISTS embedding vector(1536);
        `);

        console.log("🏗️ Creating HNSW index for high-performance Vector Search...");
        // HNSW is much faster than IVFFlat for large datasets in RAG.
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS connection_knowledge_embedding_idx 
            ON "ConnectionKnowledges" USING hnsw (embedding vector_cosine_ops);
        `);

        console.log("✅ Vector Migration Complete");
        process.exit(0);
    } catch (e) {
        console.error("❌ Migration Failed:", e.message);
        process.exit(1);
    }
}

migrate();
