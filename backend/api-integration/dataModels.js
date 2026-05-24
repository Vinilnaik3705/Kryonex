/**
 * Unified data models for cryptocurrency
 */

/**
 * Normalize crypto data to common format
 */
function normalizeCryptoData(data) {
    return {
        type: 'crypto',
        symbol: data.symbol,
        name: data.baseAsset,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        volume: data.volume,
        high: data.high,
        low: data.low,
        open: data.open,
        previousClose: data.previousClose,
        timestamp: data.timestamp
    };
}

/**
 * Normalize historical data to common format
 */
function normalizeHistoricalData(data) {
    return data.map(item => ({
        date: item.date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
    }));
}

module.exports = {
    normalizeCryptoData,
    normalizeHistoricalData
};
