const fs = require('fs');
const path = require('path');
const sequelize = require('../config/db');
const Connection = require('../models/Connection');
const ConnectionKnowledge = require('../models/ConnectionKnowledge');
const PendingExtraction = require('../models/PendingExtraction');
const User = require('../models/User');

// Models to backup
const MODELS = {
    Connection,
    ConnectionKnowledge,
    PendingExtraction,
    User
};

const BACKUP_DIR = path.join(__dirname, '../backups');

// Ensure backup dir exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
}

const backup = async (customDir) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dir = customDir || path.join(BACKUP_DIR, `backup-${timestamp}`);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    console.log(`📦 Starting backup to: ${dir}`);

    for (const [name, model] of Object.entries(MODELS)) {
        try {
            const data = await model.findAll();
            const filePath = path.join(dir, `${name}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`   ✅ Backed up ${name}: ${data.length} records`);
        } catch (err) {
            console.error(`   ❌ Failed to backup ${name}:`, err.message);
        }
    }

    console.log("✨ Backup complete.");
    return dir;
};

const restore = async (inputDir) => {
    if (!fs.existsSync(inputDir)) {
        console.error(`❌ Backup directory not found: ${inputDir}`);
        return;
    }

    console.log(`♻️  Starting restore from: ${inputDir}`);

    // Order matters for Foreign Keys! 
    // Connection -> ConnectionKnowledge / PendingExtraction
    // User is independent mostly
    const LOAD_ORDER = ['User', 'Connection', 'ConnectionKnowledge', 'PendingExtraction'];

    for (const name of LOAD_ORDER) {
        const filePath = path.join(inputDir, `${name}.json`);
        if (fs.existsSync(filePath)) {
            try {
                const raw = fs.readFileSync(filePath);
                const data = JSON.parse(raw);
                const model = MODELS[name];

                if (data.length > 0) {
                    // Safe approach: Upsert or Truncate?
                    // For a restore drill, we usually want clean state.
                    // But `force: true` in sync isn't available here easily without dropping tables.
                    // Let's use bulkCreate with updateOnDuplicate for now, or truncate first if requested.
                    // For this script, let's assume we TRUNCATE to be safe (Destructive Restore).

                    console.log(`   ⚠️  Truncating ${name}...`);
                    await model.destroy({ where: {}, truncate: true, cascade: true }); // Cascade might be needed if not careful with order

                    console.log(`   Restoring ${name}: ${data.length} records...`);
                    await model.bulkCreate(data);
                    console.log(`   ✅ Restored ${name}`);
                } else {
                    console.log(`   ℹ️  Skipping ${name} (No data)`);
                }
            } catch (err) {
                console.error(`   ❌ Failed to restore ${name}:`, err.message);
            }
        } else {
            console.log(`   ⚠️  File missing for ${name}`);
        }
    }

    console.log("✨ Restore complete.");
};

// CLI Handler
if (require.main === module) {
    const action = process.argv[2];
    const target = process.argv[3];

    (async () => {
        try {
            await sequelize.authenticate();
            if (action === 'backup') {
                await backup(target);
            } else if (action === 'restore') {
                await restore(target);
            } else {
                console.log("Usage: node backup_manager.js [backup|restore] [path]");
            }
            process.exit(0);
        } catch (e) {
            console.error(e);
            process.exit(1);
        }
    })();
}

module.exports = { backup, restore };
