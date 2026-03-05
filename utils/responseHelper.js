/**
 * Standardized API response helper
 */

/**
 * Send a success response
 * @param {Response} res 
 * @param {any} data 
 * @param {number} status 
 * @param {object} meta 
 */
const sendSuccess = (res, data, status = 200, meta = {}) => {
    return res.status(status).json({
        success: true,
        data,
        meta
    });
};

/**
 * Send an error response
 * @param {Response} res 
 * @param {string} message 
 * @param {string} code 
 * @param {number} status 
 * @param {object} details 
 */
const sendError = (res, message, code = "INTERNAL_ERROR", status = 500, details = null) => {
    return res.status(status).json({
        success: false,
        error: code,
        message,
        ...(details && { details })
    });
};

module.exports = {
    sendSuccess,
    sendError
};
