const cacheService = require('../services/cacheService');
const logger = require('../services/loggerService');

/**
 * Rate limiting middleware to prevent API abuse (Redis-backed with in-memory fallback)
 */
const localRateLimit = new Map();

const rateLimiter = async (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000; // 1 minute
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
    const windowSeconds = Math.ceil(windowMs / 1000);

    // 1. Try Redis Rate Limiting if connected
    if (cacheService.isRedisConnected && cacheService.redis) {
        try {
            const key = `rate_limit:${ip}`;
            
            // Atomically increment request count
            const count = await cacheService.redis.incr(key);
            
            // Set TTL on new keys
            if (count === 1) {
                await cacheService.redis.expire(key, windowSeconds);
            }
            
            const ttl = await cacheService.redis.ttl(key);
            const retryAfter = ttl > 0 ? ttl : windowSeconds;

            if (count > maxRequests) {
                res.set('Retry-After', retryAfter);
                return res.status(429).json({
                    error: 'Too Many Requests',
                    message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
                    retryAfter
                });
            }
            
            return next();
        } catch (err) {
            logger.error(`Redis Rate Limiter Error: ${err.message}. Falling back to local Map.`);
            // Fall back to local Map below
        }
    }

    // 2. Local memory fallback
    if (!localRateLimit.has(ip)) {
        localRateLimit.set(ip, {
            count: 1,
            resetTime: now + windowMs
        });
        return next();
    }

    const userLimit = localRateLimit.get(ip);

    // Reset if window has passed
    if (now > userLimit.resetTime) {
        localRateLimit.set(ip, {
            count: 1,
            resetTime: now + windowMs
        });
        return next();
    }

    // Increment request count
    userLimit.count++;

    // Check if limit exceeded
    if (userLimit.count > maxRequests) {
        const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
        res.set('Retry-After', retryAfter);
        return res.status(429).json({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
            retryAfter
        });
    }

    next();
};

// Clean up old local memory entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of localRateLimit.entries()) {
        if (now > data.resetTime) {
            localRateLimit.delete(ip);
        }
    }
}, 5 * 60 * 1000);

module.exports = rateLimiter;
