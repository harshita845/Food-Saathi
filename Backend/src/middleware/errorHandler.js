import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.error?.description || err.description || err.message || (typeof err.error === 'string' ? err.error : 'Server Error');
    const requestId = req.requestId || '-';

    logger.error(
        `[${requestId}] ${req.method} ${req.originalUrl} ${statusCode} - ${err.name || 'Error'} - ${message}`
    );
    if (config.nodeEnv === 'development' && (err.stack || err.error)) {
        logger.error(`[${requestId}] ${err.stack || JSON.stringify(err.error)}`);
    }

    const body = { success: false, error: message };
    // Machine-readable reason (e.g. PRICE_CHANGED, NO_RIDERS_AVAILABLE, CASH_LIMIT_EXCEEDED) for client handling
    if (typeof err.code === 'string' && /^[A-Z][A-Z0-9_]+$/.test(err.code)) {
        body.code = err.code;
    }
    res.status(statusCode).json(body);
};

export default errorHandler;
