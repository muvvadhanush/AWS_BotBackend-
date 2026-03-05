const { tenantStorage } = require("../utils/tenantContext");
const { sendError } = require("../utils/responseHelper");

/**
 * Middleware to extract tenant context and wrap request in AsyncLocalStorage
 */
const tenantIsolation = (req, res, next) => {
    // 1. Identification Hierarchy
    const connectionId =
        req.params.connectionId ||
        req.body.connectionId ||
        req.query.connectionId ||
        req.headers['x-connection-id'];

    if (!connectionId) {
        // Only enforce for routes needing isolation. 
        // Global admin routes skip this or handle multiple contexts.
        return next();
    }

    // 2. Wrap the entire request in the tenant context
    tenantStorage.run(connectionId, () => {
        // Store on req for easy access
        req.connectionId = connectionId;
        next();
    });
};

module.exports = tenantIsolation;
