const winston = require('winston');
const settings = require('../config/settings');

// Custom format for Development (Colorful, simple)
const devFormat = winston.format.printf(({ level, message, timestamp, requestId, ...meta }) => {
    const reqIdStr = requestId ? `[${requestId}]` : '';
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} ${level}: ${reqIdStr} ${message} ${metaStr}`;
});

// JSON format for Production (Structured)
const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

const logger = winston.createLogger({
    level: settings.logging || 'info', // Use setting from config
    format: settings.env === 'development'
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            devFormat
        )
        : prodFormat,
    defaultMeta: { service: 'chatbot-backend', env: settings.env },
    transports: [
        new winston.transports.Console()
    ]
});

module.exports = logger;
