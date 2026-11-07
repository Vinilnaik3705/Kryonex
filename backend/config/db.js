const { Pool } = require('pg');
const { runMigrations } = require('../services/migrationService');

let pool = null;
let databaseConnected = false;
let connectionPromise = null;
let lastConnectionFailureAt = 0;
let lastAttemptAt = null;
let lastErrorCode = null;
let lastErrorMessage = null;
const CONNECTION_RETRY_DELAY_MS = 15000;

const connectDB = async () => {
    if (pool && databaseConnected) return true;
    if (connectionPromise) return connectionPromise;
    if (Date.now() - lastConnectionFailureAt < CONNECTION_RETRY_DELAY_MS) return false;

    connectionPromise = (async () => {
        lastAttemptAt = new Date().toISOString();
        try {
            const connectionString = process.env.DATABASE_URL || process.env.POSTGRESQL_URI || process.env.POSTGRES_URI;

            if (!connectionString) {
                lastConnectionFailureAt = Date.now();
                lastErrorCode = 'DB_NOT_CONFIGURED';
                lastErrorMessage = 'PostgreSQL connection string is not configured';
                console.warn('⚠️ PostgreSQL connection string is not configured. Starting without persistent database access.');
                return false;
            }

            const statementTimeout = Number(process.env.DB_STATEMENT_TIMEOUT_MS);
            pool = new Pool({
                connectionString: connectionString.trim(),
                max: Number(process.env.DB_POOL_MAX || 10),
                idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
                connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 10000),
                query_timeout: Number(process.env.DB_QUERY_TIMEOUT_MS || 8000),
                ...(Number.isFinite(statementTimeout) && statementTimeout > 0
                    ? { statement_timeout: statementTimeout }
                    : {}),
                ssl: /supabase\.co|neon\.tech|railway\.app/i.test(connectionString)
                    ? { rejectUnauthorized: false }
                    : undefined,
            });

            await pool.query('SELECT 1');
            const client = await pool.connect();
            try {
                await runMigrations(client);
            } finally {
                client.release();
            }

            databaseConnected = true;
            lastConnectionFailureAt = 0;
            lastErrorCode = null;
            lastErrorMessage = null;
            console.log('✅ PostgreSQL Connected');
            return true;
        } catch (error) {
            databaseConnected = false;
            lastConnectionFailureAt = Date.now();
            lastErrorCode = error.code || 'DB_CONNECTION_ERROR';
            lastErrorMessage = String(error.message || 'Database connection failed')
                .replace(/\s+/g, ' ')
                .slice(0, 200);
            if (pool) {
                await pool.end().catch((closeError) => {
                    console.warn(`⚠️ PostgreSQL cleanup failed: ${closeError.message}`);
                });
                pool = null;
            }
            console.warn(`⚠️ PostgreSQL is unavailable. Continuing without persistent database access: ${error.message}`);
            return false;
        }
    })().finally(() => {
        connectionPromise = null;
    });

    return connectionPromise;
};

const getPool = () => pool;
const isDatabaseConnected = () => databaseConnected;
const getDatabaseHealth = () => ({
    connected: databaseConnected,
    lastErrorCode,
    lastErrorMessage,
    lastAttemptAt,
});
const getRetryAfterSeconds = () => {
    if (databaseConnected || !lastConnectionFailureAt) return 0;
    return Math.max(1, Math.ceil((CONNECTION_RETRY_DELAY_MS - (Date.now() - lastConnectionFailureAt)) / 1000));
};
const closeDB = async () => {
    if (pool) await pool.end();
    pool = null;
    databaseConnected = false;
    connectionPromise = null;
    lastConnectionFailureAt = 0;
    lastAttemptAt = null;
    lastErrorCode = null;
    lastErrorMessage = null;
};

module.exports = {
    connectDB,
    getPool,
    isDatabaseConnected,
    getDatabaseHealth,
    getRetryAfterSeconds,
    closeDB,
};
