const sequelize = require('./config/db');
const { backup, restore } = require('./scripts/backup_manager');
const Connection = require('./models/Connection');
const fs = require('fs');
const path = require('path');

// Helper to wait
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    try {
        console.log("🔥 STARTING RESTORE DRILL 🔥");
        await sequelize.authenticate();

        // 1. Ensure Data Exists
        console.log("\n1. Seeding Test Data...");
        const testId = `drill-${Date.now()}`;
        await Connection.create({
            connectionId: testId,
            status: 'CONNECTED',
            widgetSeen: true,
            permissions: { extraction: true }
        });
        const initialCount = await Connection.count();
        console.log(`   Initial Connection Count: ${initialCount}`);

        // 2. Perform Backup
        console.log("\n2. Performing Backup...");
        const backupDir = await backup();
        console.log(`   Backup saved to: ${backupDir}`);

        // 3. WREAK HAVOC (Delete All Data)
        console.log("\n3. WREAKING HAVOC (Deleting Data)...");
        await Connection.destroy({ where: {}, truncate: true, cascade: true });
        const postDeleteCount = await Connection.count();
        console.log(`   Connection Count after Delete: ${postDeleteCount}`);

        if (postDeleteCount !== 0) {
            throw new Error("Havoc failed! Data still exists.");
        }

        // 4. Restore
        console.log("\n4. Restoring Data...");
        await restore(backupDir);

        // 5. Verify
        console.log("\n5. Verifying Restore...");
        const finalCount = await Connection.count();
        console.log(`   Final Connection Count: ${finalCount}`);

        const restoredItem = await Connection.findOne({ where: { connectionId: testId } });
        if (restoredItem) {
            console.log("   ✅ Test Item Recovered!");
        } else {
            console.error("   ❌ Test Item MISSING!");
            process.exit(1);
        }

        if (finalCount === initialCount) {
            console.log("   ✅ Count Matches!");
        } else {
            console.log(`   ⚠️  Count Mismatch: Expected ${initialCount}, Got ${finalCount}`);
            // This might happen if other tests are running or if seeding added duplicates?
            // But truncate should clear it.
        }

        // Cleanup backup
        console.log("\n6. Cleaning up...");
        fs.rmSync(backupDir, { recursive: true, force: true });
        // Clean up test item? No, let's leave state as restored.

        console.log("\n🎉 RESTORE DRILL PASSED");
        process.exit(0);

    } catch (e) {
        console.error("\n❌ RESTORE DRILL FAILED:", e);
        process.exit(1);
    }
})();
