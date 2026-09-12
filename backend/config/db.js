const { Pool } = require('pg');

let pool = null;
let databaseConnected = false;

const connectDB = async () => {
    try {
        const connectionString = process.env.DATABASE_URL || process.env.POSTGRESQL_URI || process.env.POSTGRES_URI;

        if (!connectionString) {
            console.warn('⚠️ PostgreSQL connection string is not configured. Starting without persistent database access.');
            return false;
        }

        pool = new Pool({
            connectionString: connectionString.trim(),
            connectionTimeoutMillis: 2500,
            ssl: /supabase\.co|neon\.tech|railway\.app/i.test(connectionString)
                ? { rejectUnauthorized: false }
                : undefined,
        });

        await pool.query('SELECT 1');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS simulation_states (
                user_id TEXT PRIMARY KEY,
                wallet_balance NUMERIC NOT NULL DEFAULT 100000,
                portfolio_holdings JSONB NOT NULL DEFAULT '[]'::jsonb,
                last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        databaseConnected = true;
        console.log('✅ PostgreSQL Connected');
        return true;
    } catch (error) {
        databaseConnected = false;
        console.warn(`⚠️ PostgreSQL is unavailable. Continuing without persistent database access: ${error.message}`);
        return false;
    }
};

const getPool = () => pool;
const isDatabaseConnected = () => databaseConnected;

module.exports = { connectDB, getPool, isDatabaseConnected };
