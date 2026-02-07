const express = require("express");
const router = express.Router();
const ChatSession = require("../models/ChatSession");
const Connection = require("../models/Connection");
const ConnectionKnowledge = require("../models/ConnectionKnowledge");
const PendingExtraction = require("../models/PendingExtraction");
const connectionController = require("../controllers/connectionController");

// Existing Analytics Route
router.get("/analytics", async (req, res) => {
    try {
        const sessions = await ChatSession.findAll();
        res.json({
            totalSessions: sessions.length,
            totalMessages: sessions.reduce((a, s) => a + s.messages.length, 0)
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Knowledge Ingestion Route
router.post("/connections/:connectionId/knowledge/ingest", connectionController.ingestKnowledge);
router.post("/connections/:connectionId/branding/fetch", connectionController.fetchBranding);
router.get("/connections/:connectionId/details", connectionController.getConnectionDetails);

// --- Phase 1.7: Admin Review ---

// 1.7.2 List Pending Extractions
router.get("/connections/:connectionId/extractions", async (req, res) => {
    try {
        const { connectionId } = req.params;
        const { status } = req.query;

        const where = { connectionId };
        if (status) where.status = status;

        const extractions = await PendingExtraction.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });

        res.json(extractions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 1.7.3 Review Extraction (Approve/Reject)
router.post("/extractions/:extractionId/review", async (req, res) => {
    try {
        const { extractionId } = req.params;
        const { action, notes } = req.body; // action: "APPROVE" | "REJECT"

        const extraction = await PendingExtraction.findByPk(extractionId);
        if (!extraction) return res.status(404).json({ error: "Extraction not found" });

        if (extraction.status !== 'PENDING') {
            return res.status(400).json({ error: "Item already reviewed" });
        }

        if (action === 'REJECT') {
            extraction.status = 'REJECTED';
            extraction.reviewNotes = notes;
            extraction.reviewedAt = new Date();
            // extraction.reviewedBy = req.user.username; // If we had auth user in req
            await extraction.save();
            return res.json({ success: true, status: 'REJECTED' });
        }

        if (action === 'APPROVE') {
            const connection = await Connection.findOne({ where: { connectionId: extraction.connectionId } });

            // PROMOTE DATA
            if (extraction.extractorType === 'METADATA') {
                if (extraction.rawData.websiteName) connection.websiteName = extraction.rawData.websiteName;
                if (extraction.rawData.assistantName) connection.assistantName = extraction.rawData.assistantName;
                await connection.save();
            }
            else if (extraction.extractorType === 'BRANDING') {
                // Assuming rawData has { favicon, logo }
                // For now, we update logoUrl as a simple string if provided
                if (extraction.rawData.logo) connection.logoUrl = extraction.rawData.logo;
                await connection.save();
            }
            else if (extraction.extractorType === 'KNOWLEDGE') {
                const item = extraction.rawData;
                await ConnectionKnowledge.create({
                    connectionId: extraction.connectionId,
                    sourceType: item.type === 'url' ? 'URL' : 'TEXT',
                    sourceValue: item.url || item.text,
                    status: 'READY', // Directly ready after approval
                    metadata: { source: 'admin_approved', pageTitle: item.title }
                });
            }
            else if (extraction.extractorType === 'NAVIGATION') {
                // Phase 2: Store in separate Navigation model
                // For now, allow approval but just mark as APPROVED in Pending
                // Or append to 'extractedTools' in Connection?
                // let tools = connection.extractedTools || [];
                // tools.push(extraction.rawData);
                // connection.extractedTools = tools;
                // connection.changed('extractedTools', true);
                // await connection.save();
            }

            extraction.status = 'APPROVED';
            extraction.reviewNotes = notes;
            extraction.reviewedAt = new Date();
            await extraction.save();

            return res.json({ success: true, status: 'APPROVED' });
        }

        res.status(400).json({ error: "Invalid action" });

    } catch (error) {
        console.error("Review Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
