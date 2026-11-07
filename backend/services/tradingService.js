const { getPool } = require('../config/db');
const cryptoAPI = require('../api-integration/cryptoAPI');
const clientError = (message) => Object.assign(new Error(message), { statusCode: 400 });
const ensuredUsers = new Set();

const normalizeSymbol = (value) => {
    const raw = String(value || '').trim().toUpperCase();
    const names = {
        BITCOIN: 'BTC',
        BTC: 'BTC',
        ETHEREUM: 'ETH',
        ETH: 'ETH',
        SOLANA: 'SOL',
        SOL: 'SOL',
        DOGECOIN: 'DOGE',
        DOGE: 'DOGE',
        SHIBA: 'SHIB',
        SHIB: 'SHIB',
    };
    const symbol = names[raw] || raw.replace(/USDT$/, '');
    if (!/^[A-Z0-9]{2,15}$/.test(symbol)) throw clientError('Invalid asset symbol');
    return symbol;
};

const assertUuid = (value) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
        throw clientError('Authenticated user ID is not a valid UUID');
    }
};

const ensureUser = async (client, auth) => {
    assertUuid(auth.userId);
    const email = String(auth.email || `${auth.userId}@auth.invalid`).slice(0, 320);
    const name = auth.name ? String(auth.name).slice(0, 255) : null;
    await client.query(
        `WITH upserted_user AS (
            INSERT INTO users (id, name, email) VALUES ($1, $2, $3)
            ON CONFLICT (id) DO UPDATE SET name = COALESCE(EXCLUDED.name, users.name),
                email = EXCLUDED.email, updated_at = NOW()
            RETURNING id
        )
        INSERT INTO wallets (user_id)
        SELECT id FROM upserted_user
        ON CONFLICT (user_id) DO NOTHING`,
        [auth.userId, name, email]
    );
};

const ensureAsset = async (client, symbol, price, assetType = 'crypto') => {
    const name = symbol;
    const result = await client.query(
        `INSERT INTO assets (symbol, name, asset_type, current_price)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (symbol) DO UPDATE SET current_price = EXCLUDED.current_price, updated_at = NOW()
         RETURNING *`,
        [symbol, name, assetType, price]
    );
    return result.rows[0];
};

const toNumber = (value) => Number(value);

const getState = async (auth, db = getPool()) => {
    assertUuid(auth.userId);
    const [wallet, holdings] = await Promise.all([
        db.query('SELECT balance, updated_at FROM wallets WHERE user_id = $1', [auth.userId]),
        db.query(
        `SELECT h.id, a.symbol, a.name, a.asset_type AS type, h.quantity,
                h.average_buy_price AS "buyPrice", a.current_price AS "currentPrice", h.updated_at
         FROM holdings h JOIN assets a ON a.id = h.asset_id
         WHERE h.user_id = $1 ORDER BY a.symbol`,
        [auth.userId]
        ),
    ]);
    const updatedAt = holdings.rows.reduce((latest, row) => Math.max(latest, Date.parse(row.updated_at)), Date.parse(wallet.rows[0]?.updated_at) || 0);
    return {
        walletBalance: wallet.rows[0] ? toNumber(wallet.rows[0].balance) : 100000,
        updatedAt: new Date(updatedAt || Date.now()).toISOString(),
        portfolioHoldings: holdings.rows.map((row) => ({
            ...row,
            quantity: toNumber(row.quantity),
            buyPrice: toNumber(row.buyPrice),
            currentPrice: toNumber(row.currentPrice),
        })),
    };
};

const getTradeHistory = async (auth, limit = 100) => {
    assertUuid(auth.userId);
    const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 100, 1), 500);
    const result = await getPool().query(
        `SELECT t.id, a.symbol, a.name, t.type, t.quantity, t.price, t.total, t.created_at AS date
         FROM trades t JOIN assets a ON a.id = t.asset_id
         WHERE t.user_id = $1 ORDER BY t.created_at DESC LIMIT $2`,
        [auth.userId, safeLimit]
    );
    return result.rows.map((row) => ({
        ...row,
        quantity: toNumber(row.quantity),
        price: toNumber(row.price),
        total: toNumber(row.total),
    }));
};

const executeTrade = async ({ auth, symbol: inputSymbol, quantity, price, type, idempotencyKey, assetType = 'crypto' }) => {
    const symbol = normalizeSymbol(inputSymbol);
    const normalizedType = String(type || '').toUpperCase();
    const numericQuantity = Number(quantity);
    if (!['BUY', 'SELL'].includes(normalizedType)) throw clientError('Trade type must be BUY or SELL');
    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) throw clientError('Quantity must be positive');
    if (!idempotencyKey || String(idempotencyKey).length > 255) throw clientError('A valid Idempotency-Key is required');
    let marketPrice;
    try {
        marketPrice = await cryptoAPI.getPrice(symbol);
    } catch (error) {
        throw Object.assign(new Error('Live market price is unavailable'), { statusCode: 503, cause: error });
    }
    const executedPrice = Number(marketPrice?.price);
    const priceTimestamp = Date.parse(marketPrice?.timestamp || '');
    if (!Number.isFinite(executedPrice) || executedPrice <= 0 || marketPrice?.stale || marketPrice?.source === 'fallback'
        || !priceTimestamp || Date.now() - priceTimestamp > 30000) {
        throw Object.assign(new Error('Live market price is unavailable or stale'), { statusCode: 503 });
    }

    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const needsUserEnsure = !ensuredUsers.has(auth.userId);
        if (needsUserEnsure) {
            await ensureUser(client, auth);
        }

        const existing = await client.query(
            `SELECT id, status FROM orders WHERE user_id = $1 AND idempotency_key = $2 FOR UPDATE`,
            [auth.userId, idempotencyKey]
        );
        if (existing.rows[0]) {
            await client.query('ROLLBACK');
            return { orderId: existing.rows[0].id, status: existing.rows[0].status, idempotent: true, ...(await getState(auth, client)) };
        }

        const asset = await ensureAsset(client, symbol, executedPrice, assetType);
        const order = await client.query(
            `INSERT INTO orders (user_id, asset_id, type, quantity, status, idempotency_key)
             VALUES ($1, $2, $3, $4, 'PENDING', $5) RETURNING id`,
            [auth.userId, asset.id, normalizedType, numericQuantity, idempotencyKey]
        );
        const total = numericQuantity * executedPrice;

        const wallet = await client.query('SELECT id, balance FROM wallets WHERE user_id = $1 FOR UPDATE', [auth.userId]);
        if (normalizedType === 'BUY') {
            if (Number(wallet.rows[0].balance) < total) throw clientError('Insufficient wallet balance');
            await client.query(
                'UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE id = $2',
                [total.toFixed(2), wallet.rows[0].id]
            );
            await client.query(
                `INSERT INTO holdings (user_id, asset_id, quantity, average_buy_price)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (user_id, asset_id) DO UPDATE SET
                   average_buy_price = ((holdings.quantity * holdings.average_buy_price) + ($3 * $4)) / (holdings.quantity + $3),
                   quantity = holdings.quantity + $3, updated_at = NOW()`,
                [auth.userId, asset.id, numericQuantity, executedPrice]
            );
        } else {
            const holding = await client.query(
                'SELECT id, quantity FROM holdings WHERE user_id = $1 AND asset_id = $2 FOR UPDATE',
                [auth.userId, asset.id]
            );
            if (!holding.rows[0] || Number(holding.rows[0].quantity) < numericQuantity) {
                throw clientError('Insufficient asset quantity');
            }
            const remaining = Number(holding.rows[0].quantity) - numericQuantity;
            if (remaining === 0) {
                await client.query('DELETE FROM holdings WHERE id = $1', [holding.rows[0].id]);
            } else {
                await client.query(
                    'UPDATE holdings SET quantity = $1, updated_at = NOW() WHERE id = $2',
                    [remaining, holding.rows[0].id]
                );
            }
            await client.query(
                'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2',
                [total.toFixed(2), wallet.rows[0].id]
            );
        }

        await client.query(
            `INSERT INTO trades (user_id, asset_id, type, quantity, price, total)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [auth.userId, asset.id, normalizedType, numericQuantity, executedPrice, total.toFixed(2)]
        );
        await client.query(
            `UPDATE orders SET status = 'COMPLETED', updated_at = NOW() WHERE id = $1`,
            [order.rows[0].id]
        );
        await client.query('COMMIT');
        if (needsUserEnsure) ensuredUsers.add(auth.userId);
        try {
            return { orderId: order.rows[0].id, status: 'COMPLETED', executedPrice, ...(await getState(auth, client)) };
        } catch (stateError) {
            console.error(`Trade committed but state refresh failed: ${stateError.message}`);
            return { orderId: order.rows[0].id, status: 'COMPLETED', executedPrice };
        }
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = { getState, getTradeHistory, executeTrade };
