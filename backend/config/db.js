const { Pool } = require('pg');
const { runMigrations } = require('../services/migrationService');

let pool = null;
let databaseConnected = false;
let connectionPromise = null;

const connectDB = async () => {
    if (connectionPromise) return connectionPromise;

    connectionPromise = (async () => {
    try {
        const connectionString = process.env.DATABASE_URL || process.env.POSTGRESQL_URI || process.env.POSTGRES_URI;

        if (!connectionString) {
            console.warn('⚠️ PostgreSQL connection string is not configured. Starting without persistent database access.');
            return false;
        }

        pool = new Pool({
            connectionString: connectionString.trim(),
            max: Number(process.env.DB_POOL_MAX || 10),
            idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
            connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 5000),
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
        console.log('✅ PostgreSQL Connected');
        return true;
    } catch (error) {
        databaseConnected = false;
        console.warn(`⚠️ PostgreSQL is unavailable. Continuing without persistent database access: ${error.message}`);
        return false;
    }
    })();

    return connectionPromise;
};

const getPool = () => pool;
const isDatabaseConnected = () => databaseConnected;
const closeDB = async () => {
    if (pool) await pool.end();
    pool = null;
    databaseConnected = false;
    connectionPromise = null;
};

module.exports = { connectDB, getPool, isDatabaseConnected, closeDB };
