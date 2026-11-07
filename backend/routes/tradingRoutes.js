const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { connectDB, isDatabaseConnected } = require('../config/db');
const tradingService = require('../services/tradingService');

const router = express.Router();
const requireDatabase = async (req, res, next) => {
    await connectDB();
    if (!isDatabaseConnected()) {
        return res.status(503).json({ success: false, error: 'Persistent trading database is unavailable' });
    }
    return next();
};

router.use(protect, requireDatabase);

router.get('/state', async (req, res, next) => {
    try {
        res.json({ success: true, data: await tradingService.getState(req.auth) });
    } catch (error) {
        next(error);
    }
});

router.get('/history', async (req, res, next) => {
    try {
        res.json({ success: true, data: await tradingService.getTradeHistory(req.auth, req.query.limit) });
    } catch (error) {
        next(error);
    }
});

router.post('/orders', async (req, res, next) => {
    try {
        const idempotencyKey = req.get('Idempotency-Key') || req.body?.idempotencyKey;
        const result = await tradingService.executeTrade({ ...req.body, auth: req.auth, idempotencyKey });
        res.status(result.idempotent ? 200 : 201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
