const fs = require('fs/promises');
const path = require('path');

const migrationsDirectory = path.join(__dirname, '..', 'migrations');

const runMigrations = async (client) => {
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    const files = (await fs.readdir(migrationsDirectory))
        .filter((file) => file.endsWith('.sql'))
        .sort();

    for (const file of files) {
        const applied = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [file]);
        if (applied.rowCount > 0) continue;

        await client.query('BEGIN');
        try {
            const sql = await fs.readFile(path.join(migrationsDirectory, file), 'utf8');
            await client.query(sql);
            await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
    }
};

module.exports = { runMigrations };
