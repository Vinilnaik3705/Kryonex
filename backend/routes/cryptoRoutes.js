const express = require('express');
const router = express.Router();
const cryptoAPI = require('../api-integration/cryptoAPI');

const boundedInt = (value, fallback, min, max) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? Math.min(Math.max(parsed, min), max) : fallback;
};

const normalizeSymbols = (value) => [...new Set(String(value || '')
    .split(',')
    .map((symbol) => symbol.trim().toUpperCase())
    .filter((symbol) => /^[A-Z0-9]{2,15}$/.test(symbol)))]
    .slice(0, 20);

/**
 * GET /api/crypto/price/:symbol
 * Get real-time crypto price
 */
router.get('/price/:symbol', async (req, res, next) => {
    try {
        const { symbol } = req.params;
        if (!/^[a-zA-Z0-9_-]{1,15}$/.test(symbol)) return res.status(400).json({ success: false, error: 'Invalid symbol' });
        const data = await cryptoAPI.getPrice(symbol);
        res.set('Cache-Control', 'no-store');
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/crypto/history/:symbol
 * Get historical crypto data
 * Query params: interval (1m, 5m, 15m, 1h, 4h, 1d, 1w), limit (default: 30)
 */
router.get('/history/:symbol', async (req, res, next) => {
    try {
        const { symbol } = req.params;
        if (!/^[a-zA-Z0-9_-]{1,15}$/.test(symbol)) return res.status(400).json({ success: false, error: 'Invalid symbol' });
        const { interval = '1d' } = req.query;
        const allowedIntervals = new Set(['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M']);
        if (!allowedIntervals.has(interval)) return res.status(400).json({ success: false, error: 'Invalid interval' });
        const data = await cryptoAPI.getHistory(symbol, interval, boundedInt(req.query.limit, 30, 1, 500));
        res.set('Cache-Control', 'public, max-age=15, stale-while-revalidate=30');
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/crypto/trending
 * Get trending cryptocurrencies (top gainers and losers)
 * Query params: limit (default: 10)
 */
router.get('/trending', async (req, res, next) => {
    try {
        const data = await cryptoAPI.getTrending(boundedInt(req.query.limit, 10, 1, 25));
        res.set('Cache-Control', 'public, max-age=15, stale-while-revalidate=30');
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/crypto/market-cap
 * Get top cryptocurrencies by market cap (volume)
 * Query params: limit (default: 50)
 */
router.get('/market-cap', async (req, res, next) => {
    try {
        const data = await cryptoAPI.getTopByMarketCap(boundedInt(req.query.limit, 50, 1, 100));
        res.set('Cache-Control', 'public, max-age=15, stale-while-revalidate=30');
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/crypto/search
 * Search for cryptocurrencies
 * Query params: q (search query)
 */
router.get('/search', async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter "q" is required'
            });
        }
        const data = await cryptoAPI.search(q);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/crypto/batch
 * Get prices for multiple crypto symbols
 * Query params: symbols (comma-separated list)
 */
router.get('/batch', async (req, res, next) => {
    try {
        const { symbols } = req.query;
        if (!symbols) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter "symbols" is required'
            });
        }

        const symbolList = normalizeSymbols(symbols);
        if (!symbolList.length) {
            return res.status(400).json({ success: false, error: 'No valid symbols supplied' });
        }
        const prices = await cryptoAPI.getBatchPrices(symbolList);

        res.set('Cache-Control', 'no-store');
        res.json({ success: true, data: prices });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/crypto/info/:symbol
 * Get exchange info for a crypto symbol
 */
router.get('/info/:symbol', async (req, res, next) => {
    try {
        const { symbol } = req.params;
        if (!/^[a-zA-Z0-9_-]{1,15}$/.test(symbol)) return res.status(400).json({ success: false, error: 'Invalid symbol' });
        const data = await cryptoAPI.getExchangeInfo(symbol);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
