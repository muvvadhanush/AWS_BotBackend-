const rateLimit = require('express-rate-limit');
const settings = require('../config/settings');

// Standard error response helper
const limitReachedResponse = (req, res, next, options) => {
    res.status(options.statusCode).json({
        error: "RATE_LIMITED",
        message: options.message,
        requestId: req.headers['x-request-id'] || Date.now().toString()
    });
};

// Key Generators
const keyGenerators = {
    // Key by IP (Default)
    ip: (req) => req.ip,

    // Key by Connection ID (if present in body/params)
    connection: (req) => {
        return req.body.connectionId || req.params.connectionId || req.ip;
    },

    // Key by Authenticated User (if present)
    user: (req) => {
        return req.user ? req.user.username : req.ip;
    }
};

/**
 * Factory to create a limiter
 * @param {Object} config - { windowMs, max } from settings
 * @param {string} keyType - 'ip' | 'connection' | 'user'
 * @param {string} customMessage - Optional custom error message
 */
const createLimiter = (config, keyType = 'ip', customMessage) => {
    return rateLimit({
        windowMs: config.windowMs,
        max: config.max,
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        keyGenerator: keyGenerators[keyType] || keyGenerators.ip,
        handler: limitReachedResponse,
        message: customMessage || "Too many requests, please try again later."
    });
};

// Pre-configured Limiters
const limiters = {
    widgetChat: createLimiter(settings.rateLimits.widget.chat, 'connection', "Chat rate limit exceeded."),
    widgetExtraction: createLimiter(settings.rateLimits.widget.extraction, 'connection', "Extraction limit exceeded (max 5/day)."),
    adminActions: createLimiter(settings.rateLimits.admin.actions, 'user', "Admin action rate limit exceeded."),
    authLimits: createLimiter(settings.rateLimits.admin.auth, 'ip', "Too many login attempts."),
    systemHealth: createLimiter(settings.rateLimits.system.health, 'ip')
};

module.exports = limiters;
