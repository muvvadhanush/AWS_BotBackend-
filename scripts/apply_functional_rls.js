const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
    process.env.DB_NAME || process.env.database,
    process.env.DB_USER || process.env.user,
    process.env.DB_PASSWORD || process.env.password,
    {
        host: process.env.DB_HOST || process.env.db_host || "localhost",
        dialect: "postgres",
        port: process.env.DB_PORT || process.env.port || 5432,
        logging: false,
        dialectOptions: {
            ssl: { require: true, rejectUnauthorized: false }
        }
    }
);

async function applyFunctionalRls() {
    try {
        await sequelize.authenticate();
        console.log('🚀 [RLS] Applying Functional Tenant Isolation...');

        const tenantTables = [
            'ChatSessions',
            'ConnectionKnowledges',
            'PendingExtractions',
            'ConnectionDiscoveries',
            'KnowledgeCoverages',
            'KnowledgeCategories',
            'PageContents'
            // Connections table handled specially
        ];

        // 1. Core Connection Isolation
        console.log("🔒 Enabling RLS on 'Connections'...");
        await sequelize.query(`ALTER TABLE "Connections" ENABLE ROW LEVEL SECURITY;`);
        await sequelize.query(`DROP POLICY IF EXISTS "tenant_isolation_connections" ON "Connections";`);
        await sequelize.query(`
            CREATE POLICY "tenant_isolation_connections" ON "Connections"
            FOR ALL
            USING ("connectionId" = current_setting('app.connection_id', true));
        `);

        // 2. Generic Tenant Table Isolation
        for (const table of tenantTables) {
            console.log(`🔒 Enabling RLS on '${table}'...`);
            try {
                await sequelize.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
                await sequelize.query(`DROP POLICY IF EXISTS "tenant_isolation_${table.toLowerCase()}" ON "${table}";`);
                await sequelize.query(`
                    CREATE POLICY "tenant_isolation_${table.toLowerCase()}" ON "${table}"
                    FOR ALL
                    USING ("connectionId" = current_setting('app.connection_id', true));
                `);
            } catch (e) {
                console.warn(`⚠️ Failed on ${table}: ${e.message}`);
            }
        }

        // 3. User & Auth Bypass (Usually global access needed)
        // We'll leave Users and system tables alone for now or handle via RBAC.

        console.log('✅ [RLS] Functional policies applied. Application must now use SET LOCAL app.connection_id = <X>');
        process.exit(0);
    } catch (error) {
        console.error('❌ RLS Update Failed:', error.message);
        process.exit(1);
    }
}

applyFunctionalRls();
