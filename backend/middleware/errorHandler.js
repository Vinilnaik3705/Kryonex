const logger = require('../services/loggerService');

/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    logger.error(`${req.method} ${req.originalUrl || req.url} - Error: ${err.message}`, { stack: err.stack });

    // Default error status and message
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
    }

    if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized';
    }

    // API-specific errors
    if (err.isAxiosError) {
        statusCode = err.response?.status || 502;
        message = `External API Error: ${err.response?.data?.message || err.message}`;
    }

    // Send error response
    res.status(statusCode).json({
        error: {
            message,
            status: statusCode,
            ...(process.env.NODE_ENV === 'development' && {
                stack: err.stack,
                details: err.details
            })
        }
    });
};

module.exports = errorHandler;
