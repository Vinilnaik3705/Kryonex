const { Pool } = require('pg');
const { runMigrations } = require('../services/migrationService');

let pool = null;
let databaseConnected = false;
let connectionPromise = null;
let lastConnectionFailureAt = 0;
const CONNECTION_RETRY_DELAY_MS = 15000;

const connectDB = async () => {
    if (pool && databaseConnected) return true;
    if (connectionPromise) return connectionPromise;
    if (Date.now() - lastConnectionFailureAt < CONNECTION_RETRY_DELAY_MS) return false;

    connectionPromise = (async () => {
        try {
            const connectionString = process.env.DATABASE_URL || process.env.POSTGRESQL_URI || process.env.POSTGRES_URI;

            if (!connectionString) {
                lastConnectionFailureAt = Date.now();
                console.warn('⚠️ PostgreSQL connection string is not configured. Starting without persistent database access.');
                return false;
            }

            pool = new Pool({
                connectionString: connectionString.trim(),
                max: Number(process.env.DB_POOL_MAX || 10),
                idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
                connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 3000),
                statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT_MS || 8000),
                query_timeout: Number(process.env.DB_QUERY_TIMEOUT_MS || 8000),
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
            console.log('✅ PostgreSQL Connected');
            return true;
        } catch (error) {
            databaseConnected = false;
            lastConnectionFailureAt = Date.now();
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
const closeDB = async () => {
    if (pool) await pool.end();
    pool = null;
    databaseConnected = false;
    connectionPromise = null;
    lastConnectionFailureAt = 0;
};

module.exports = { connectDB, getPool, isDatabaseConnected, closeDB };
