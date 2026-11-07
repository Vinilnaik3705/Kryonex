require('dotenv').config();
const { Client } = require('pg');
const { runMigrations } = require('../services/migrationService');

const run = async () => {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRESQL_URI || process.env.POSTGRES_URI;
    if (!connectionString) throw new Error('DATABASE_URL is not configured');

    const client = new Client({
        connectionString: connectionString.trim(),
        connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 3000),
        ssl: /supabase\.co|neon\.tech|railway\.app/i.test(connectionString)
            ? { rejectUnauthorized: false }
            : undefined,
    });

    await client.connect();
    try {
        await runMigrations(client);
        console.log('Database migrations are up to date');
    } finally {
        await client.end();
    }
};

run().catch((error) => {
    console.error(`Migration failed: ${error.message}`);
    process.exitCode = 1;
});
