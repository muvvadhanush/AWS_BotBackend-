const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
    // 1. Generate or Retrieve Request ID
    req.requestId = req.headers['x-request-id'] || uuidv4();
    res.setHeader('X-Request-ID', req.requestId);

    // 2. Log Request Start (Verbose/Debug only usually, or Info for critical)
    const startTime = Date.now();

    // 3. Log Response Finish
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

        logger.log({
            level,
            message: `${req.method} ${req.originalUrl}`,
            requestId: req.requestId,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            connectionId: req.body.connectionId || req.params.connectionId
        });
    });

    next();
};

module.exports = requestLogger;
