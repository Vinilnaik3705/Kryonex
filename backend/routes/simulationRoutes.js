const express = require('express');
const { requireAuth } = require('@clerk/express');
const SimulationState = require('../models/SimulationState');

const router = express.Router();

const protect = requireAuth();

const saveSimulationState = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        const { walletBalance, portfolioHoldings } = req.body || {};

        const nextState = await SimulationState.findOneAndUpdate(
            { userId },
            {
                userId,
                walletBalance: Number.isFinite(Number(walletBalance)) ? Number(walletBalance) : 100000,
                portfolioHoldings: Array.isArray(portfolioHoldings) ? portfolioHoldings : [],
                lastSyncedAt: new Date(),
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();

        return res.json({ success: true, data: nextState });
    } catch (error) {
        console.error('Failed to save simulation state:', error);
        return res.status(500).json({ success: false, error: 'Failed to save simulation state' });
    }
};

router.get('/state', protect, async (req, res) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        const state = await SimulationState.findOne({ userId }).lean();

        return res.json({
            success: true,
            data: state || {
                userId,
                walletBalance: 100000,
                portfolioHoldings: [],
            },
        });
    } catch (error) {
        console.error('Failed to load simulation state:', error);
        return res.status(500).json({ success: false, error: 'Failed to load simulation state' });
    }
});

router.post('/state', protect, saveSimulationState);

router.put('/state', protect, async (req, res) => {
    return saveSimulationState(req, res);
});

module.exports = router;
