const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now,
    },
    type: {
        type: String,
        enum: ['buy', 'sell'],
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    total: {
        type: Number,
        required: true,
    },
}, { _id: false });

const holdingSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
    },
    type: {
        type: String,
        default: 'crypto',
    },
    quantity: {
        type: Number,
        required: true,
    },
    buyPrice: {
        type: Number,
        required: true,
    },
    trades: {
        type: [tradeSchema],
        default: [],
    },
}, { _id: false });

const simulationStateSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    walletBalance: {
        type: Number,
        default: 100000,
    },
    portfolioHoldings: {
        type: [holdingSchema],
        default: [],
    },
    lastSyncedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

simulationStateSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('SimulationState', simulationStateSchema);
