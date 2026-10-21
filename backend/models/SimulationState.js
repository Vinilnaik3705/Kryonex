const { getPool } = require('../config/db');

const toState = (row) => row && ({
    userId: row.user_id,
    walletBalance: Number(row.wallet_balance),
    portfolioHoldings: row.portfolio_holdings,
    lastSyncedAt: row.last_synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

const findByUserId = async (userId) => {
    const result = await getPool().query(
        'SELECT * FROM simulation_states WHERE user_id = $1',
        [userId]
    );
    return toState(result.rows[0]);
};

const upsert = async ({ userId, walletBalance, portfolioHoldings }) => {
    const result = await getPool().query(
        `INSERT INTO simulation_states (user_id, wallet_balance, portfolio_holdings, last_synced_at, updated_at)
         VALUES ($1, $2, $3::jsonb, NOW(), NOW())
         ON CONFLICT (user_id) DO UPDATE SET
            wallet_balance = EXCLUDED.wallet_balance,
            portfolio_holdings = EXCLUDED.portfolio_holdings,
            last_synced_at = NOW(),
            updated_at = NOW()
         RETURNING *`,
        [userId, walletBalance, JSON.stringify(portfolioHoldings)]
    );
    return toState(result.rows[0]);
};

module.exports = { findByUserId, upsert };
