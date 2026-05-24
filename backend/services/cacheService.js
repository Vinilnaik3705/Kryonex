const NodeCache = require('node-cache');
const Redis = require('ioredis');
const logger = require('./loggerService');

/**
 * Cache service for storing API responses with Redis support and in-memory fallback
 */
class CacheService {
    constructor() {
        this.nodeCache = new NodeCache({
            stdTTL: 60, // Default TTL: 60 seconds
            checkperiod: 120, // Check for expired keys every 2 minutes
            useClones: false // Better performance
        });

        this.isRedisConnected = false;
        this.redis = null;

        const redisUrl = process.env.REDIS_URL;
        if (redisUrl) {
            try {
                logger.info(`Connecting to Redis at: ${redisUrl.replace(/:([^:@]+)@/, ':****@')}`);
                this.redis = new Redis(redisUrl, {
                    maxRetriesPerRequest: 1,
                    enableOfflineQueue: false,
                    connectTimeout: 2000
                });

                this.redis.on('connect', () => {
                    this.isRedisConnected = true;
                    logger.info('✅ Redis cache connected successfully.');
                });

                this.redis.on('error', (err) => {
                    if (this.isRedisConnected) {
                        logger.warn(`⚠️ Redis error: ${err.message}. Falling back to in-memory cache.`);
                    }
                    this.isRedisConnected = false;
                });
            } catch (e) {
                logger.warn(`⚠️ Failed to initialize Redis client: ${e.message}. Using in-memory cache.`);
                this.isRedisConnected = false;
            }
        } else {
            logger.info('ℹ️ Redis URL not configured. Using in-memory cache.');
        }
    }

    /**
     * Get value from cache
     */
    async get(key) {
        if (this.isRedisConnected && this.redis) {
            try {
                const data = await this.redis.get(key);
                return data ? JSON.parse(data) : null;
            } catch (err) {
                logger.error(`Redis get error for key ${key}: ${err.message}`);
                return this.nodeCache.get(key);
            }
        }
        return this.nodeCache.get(key);
    }

    /**
     * Set value in cache with optional TTL
     */
    async set(key, value, ttl = null) {
        if (this.isRedisConnected && this.redis) {
            try {
                const serialized = JSON.stringify(value);
                if (ttl) {
                    await this.redis.set(key, serialized, 'EX', ttl);
                } else {
                    await this.redis.set(key, serialized);
                }
                return true;
            } catch (err) {
                logger.error(`Redis set error for key ${key}: ${err.message}`);
            }
        }
        if (ttl) {
            return this.nodeCache.set(key, value, ttl);
        }
        return this.nodeCache.set(key, value);
    }

    /**
     * Delete key from cache
     */
    async del(key) {
        if (this.isRedisConnected && this.redis) {
            try {
                await this.redis.del(key);
                return true;
            } catch (err) {
                logger.error(`Redis del error for key ${key}: ${err.message}`);
            }
        }
        return this.nodeCache.del(key);
    }

    /**
     * Clear all cache
     */
    async flush() {
        if (this.isRedisConnected && this.redis) {
            try {
                await this.redis.flushall();
                return true;
            } catch (err) {
                logger.error(`Redis flushall error: ${err.message}`);
            }
        }
        return this.nodeCache.flushAll();
    }

    /**
     * Check if key exists
     */
    async has(key) {
        if (this.isRedisConnected && this.redis) {
            try {
                const exists = await this.redis.exists(key);
                return exists === 1;
            } catch (err) {
                logger.error(`Redis exists error for key ${key}: ${err.message}`);
            }
        }
        return this.nodeCache.has(key);
    }
}

// Export singleton instance
module.exports = new CacheService();
