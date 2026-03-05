const { AsyncLocalStorage } = require('async_hooks');

/**
 * Global storage for tenant context (multi-tenancy)
 */
const tenantStorage = new AsyncLocalStorage();

/**
 * Execute a callback within a specific tenant context
 */
const runInTenantContext = (connectionId, callback) => {
    return tenantStorage.run(connectionId, callback);
};

/**
 * Get the current connectionId from context
 */
const getTenantContext = () => {
    return tenantStorage.getStore();
};

module.exports = {
    tenantStorage,
    runInTenantContext,
    getTenantContext
};
