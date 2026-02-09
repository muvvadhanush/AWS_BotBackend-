const express = require('express');
const router = express.Router();
const limiters = require("../../middleware/rateLimiter");

const chatRoutes = require("../chatRoutes");
const connectionRoutes = require("../connectionRoutes"); // Connection mgmt & extraction
const widgetRoutes = require("../widgetRoutes");
const adminRoutes = require("../adminRoutes");
const ideaRoutes = require("../ideaRoutes");

// 1. Widget / Public Routes (High Volume)
// Apply Chat Rate Limit to Chat & Widget endpoints
router.use("/chat", limiters.widgetChat, chatRoutes);
router.use("/widget", limiters.widgetChat, widgetRoutes); // Widget loads, etc.

// 2. Admin Routes (Sensitive)
router.use("/admin", limiters.adminActions, adminRoutes);

// 3. Ideas (User Submission) - Treat as Widget traffic for now
router.use("/ideas", limiters.widgetChat, ideaRoutes); // Ideas are submitted via widget

// 4. Connection Management (Mixed)
// Some endpoints are admin (listing), some are widget (extraction)
// We'll apply a baseline limit here, and specific limits inside the router if needed.
// actually connectionRoutes has mixed auth.
// Let's not apply a blanket limit here, but let the specific routes handle it or apply a generous one.
// For now, let's leave connectionRoutes without a router-level limit and rely on internal logic + specific extraction limit.
router.use("/connections", connectionRoutes);

module.exports = router;
