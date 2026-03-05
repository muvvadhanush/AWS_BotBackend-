const { sendError } = require("../utils/responseHelper");
const Connection = require("../models/Connection");

/**
 * Middleware to enforce domain locking
 */
const domainLock = async (req, res, next) => {
    try {
        const connectionId = req.params.connectionId || req.body.connectionId;

        if (!connectionId) {
            return next(); // Let controllers handle missing ID
        }

        const connection = await Connection.findOne({
            where: { connectionId }
        });

        if (!connection) {
            return sendError(res, "Connection not found", "CONNECTION_NOT_FOUND", 404);
        }

        const origin = req.headers.origin || req.headers.referer;

        if (connection.allowedDomains && connection.allowedDomains.length > 0) {
            const domains = Array.isArray(connection.allowedDomains)
                ? connection.allowedDomains
                : [connection.allowedDomains];

            const isAllowed = domains.includes('*') ||
                (origin && domains.some(d => origin.includes(d.replace(/^https?:\/\//, ''))));

            if (!isAllowed) {
                return sendError(res, "This domain is not authorized.", "DOMAIN_NOT_ALLOWED", 403);
            }
        }

        req.connection = connection; // Attach to request for later use
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = domainLock;
