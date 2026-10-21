const express = require('express');
const mongoose = require('mongoose');
const SimulationState = require('../models/SimulationState');
const { protect } = require('../middleware/authMiddleware');
const fileSimulationStore = require('../services/simulationStore');

const router = express.Router();
const getDefaultSimulationState = (userId) => ({
    userId,
    walletBalance: 100000,
    portfolioHoldings: [],
    persisted: false,
});

const isMongoConnected = () => mongoose.connection.readyState === 1;

const saveSimulationState = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        const { walletBalance, portfolioHoldings } = req.body || {};

        if (!isMongoConnected()) {
            const nextState = {
                userId,
                walletBalance: Number.isFinite(Number(walletBalance)) ? Number(walletBalance) : 100000,
                portfolioHoldings: Array.isArray(portfolioHoldings) ? portfolioHoldings : [],
                lastSyncedAt: new Date(),
            };

            const persistedState = await fileSimulationStore.saveSimulationState(userId, nextState);

            return res.json({ success: true, data: persistedState });
        }

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

        return res.json({ success: true, data: { ...nextState, persisted: true } });
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

        if (!isMongoConnected()) {
            const state = await fileSimulationStore.getSimulationState(userId);

            return res.json({
                success: true,
                data: state || getDefaultSimulationState(userId),
            });
        }

        const state = await SimulationState.findOne({ userId }).lean();

        return res.json({
            success: true,
            data: state ? { ...state, persisted: true } : {
                userId,
                walletBalance: 100000,
                portfolioHoldings: [],
                persisted: false,
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
