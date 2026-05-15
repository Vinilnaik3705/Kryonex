const axios = require('axios');
const cacheService = require('../services/cacheService');

// Fallback crypto data (in case Binance API fails)
const FALLBACK_CRYPTO = [
    { symbol: 'BTCUSDT', baseAsset: 'BTC', price: 95141.87, changePercent: 2.34, quoteVolume: 28500000000, high: 96200, low: 93800 },
    { symbol: 'ETHUSDT', baseAsset: 'ETH', price: 3332.87, changePercent: 1.82, quoteVolume: 15200000000, high: 3380, low: 3280 },
    { symbol: 'BNBUSDT', baseAsset: 'BNB', price: 635.40, changePercent: 0.95, quoteVolume: 2100000000, high: 642, low: 628 },
    { symbol: 'SOLUSDT', baseAsset: 'SOL', price: 141.88, changePercent: 5.67, quoteVolume: 3800000000, high: 145, low: 135 },
    { symbol: 'XRPUSDT', baseAsset: 'XRP', price: 2.85, changePercent: 3.21, quoteVolume: 4200000000, high: 2.92, low: 2.76 },
    { symbol: 'ADAUSDT', baseAsset: 'ADA', price: 1.02, changePercent: 2.15, quoteVolume: 1800000000, high: 1.05, low: 0.99 },
    { symbol: 'DOGEUSDT', baseAsset: 'DOGE', price: 0.38, changePercent: 1.45, quoteVolume: 2500000000, high: 0.39, low: 0.37 },
    { symbol: 'AVAXUSDT', baseAsset: 'AVAX', price: 42.50, changePercent: 4.12, quoteVolume: 1200000000, high: 43.8, low: 40.5 },
    { symbol: 'DOTUSDT', baseAsset: 'DOT', price: 8.95, changePercent: -0.85, quoteVolume: 850000000, high: 9.15, low: 8.82 },
    { symbol: 'MATICUSDT', baseAsset: 'MATIC', price: 1.15, changePercent: 1.92, quoteVolume: 920000000, high: 1.18, low: 1.12 },
    { symbol: 'LINKUSDT', baseAsset: 'LINK', price: 22.40, changePercent: 2.67, quoteVolume: 780000000, high: 22.9, low: 21.8 },
    { symbol: 'LTCUSDT', baseAsset: 'LTC', price: 105.20, changePercent: 0.45, quoteVolume: 650000000, high: 107, low: 104 },
    { symbol: 'UNIUSDT', baseAsset: 'UNI', price: 13.85, changePercent: 3.45, quoteVolume: 580000000, high: 14.2, low: 13.4 },
    { symbol: 'ATOMUSDT', baseAsset: 'ATOM', price: 11.20, changePercent: 1.78, quoteVolume: 420000000, high: 11.5, low: 11.0 },
    { symbol: 'ETCUSDT', baseAsset: 'ETC', price: 32.50, changePercent: -1.25, quoteVolume: 380000000, high: 33.2, low: 32.1 },
    { symbol: 'XLMUSDT', baseAsset: 'XLM', price: 0.42, changePercent: 2.34, quoteVolume: 350000000, high: 0.43, low: 0.41 },
    { symbol: 'ALGOUSDT', baseAsset: 'ALGO', price: 0.38, changePercent: 1.56, quoteVolume: 320000000, high: 0.39, low: 0.37 },
    { symbol: 'VETUSDT', baseAsset: 'VET', price: 0.048, changePercent: 0.92, quoteVolume: 290000000, high: 0.049, low: 0.047 },
    { symbol: 'FILUSDT', baseAsset: 'FIL', price: 6.85, changePercent: 2.18, quoteVolume: 270000000, high: 7.0, low: 6.7 },
    { symbol: 'TRXUSDT', baseAsset: 'TRX', price: 0.25, changePercent: 1.34, quoteVolume: 450000000, high: 0.26, low: 0.24 }
];

/**
 * Binance API Integration for Cryptocurrency
 */
class CryptoAPI {
    constructor() {
        this.baseURL = 'https://api.binance.com/api/v3';
        this.cacheTTL = {
            price: parseInt(process.env.CACHE_TTL_QUOTE) || 5,
            history: parseInt(process.env.CACHE_TTL_HISTORY) || 300,
            trending: parseInt(process.env.CACHE_TTL_SEARCH) || 600
        };
    }

    /**
     * Get real-time crypto price
     */
    async getPrice(symbol) {
        // Normalize symbol (e.g., BTC -> BTCUSDT)
        const tradingPair = symbol.toUpperCase().endsWith('USDT')
            ? symbol.toUpperCase()
            : `${symbol.toUpperCase()}USDT`;

        try {
            // Get 24hr ticker data
            const response = await axios.get(`${this.baseURL}/ticker/24hr`, {
                params: { symbol: tradingPair }
            });

            const ticker = response.data;

            const data = {
                symbol: tradingPair,
                baseAsset: symbol.toUpperCase().replace('USDT', ''),
                price: parseFloat(ticker.lastPrice),
                change: parseFloat(ticker.priceChange),
                changePercent: parseFloat(ticker.priceChangePercent),
                volume: parseFloat(ticker.volume),
                quoteVolume: parseFloat(ticker.quoteVolume),
                high: parseFloat(ticker.highPrice),
                low: parseFloat(ticker.lowPrice),
                open: parseFloat(ticker.openPrice),
                previousClose: parseFloat(ticker.prevClosePrice),
                trades: ticker.count,
                timestamp: new Date(ticker.closeTime).toISOString()
            };
            return data;
        } catch (error) {
            if (error.response?.status === 400) {
                throw new Error(`Invalid trading pair: ${tradingPair}`);
            }
            throw new Error(`Failed to fetch crypto price for ${symbol}: ${error.message}`);
        }
    }

    /**
     * Get historical crypto data (candlestick/klines)
     */
    async getHistory(symbol, interval = '1d', limit = 30) {
        const tradingPair = symbol.toUpperCase().endsWith('USDT')
            ? symbol.toUpperCase()
            : `${symbol.toUpperCase()}USDT`;

        const cacheKey = `crypto:history:${tradingPair}:${interval}:${limit}`;
        const cached = cacheService.get(cacheKey);

        if (cached) {
            return cached;
        }

        try {
            const response = await axios.get(`${this.baseURL}/klines`, {
                params: {
                    symbol: tradingPair,
                    interval,
                    limit
                }
            });

            const data = response.data.map(candle => ({
                date: new Date(candle[0]).toISOString(),
                open: parseFloat(candle[1]),
                high: parseFloat(candle[2]),
                low: parseFloat(candle[3]),
                close: parseFloat(candle[4]),
                volume: parseFloat(candle[5])
            }));

            cacheService.set(cacheKey, data, this.cacheTTL.history);
            return data;
        } catch (error) {
            throw new Error(`Failed to fetch crypto history for ${symbol}: ${error.message}`);
        }
    }

    /**
     * Get top cryptocurrencies by market cap (with guaranteed fallback)
     */
    async getTopByMarketCap(limit = 50) {
        const cacheKey = `crypto:top:${limit}`;
        const cached = cacheService.get(cacheKey);

        if (cached) {
            return cached;
        }

        try {
            // Try to get real data from Binance
            const response = await axios.get(`${this.baseURL}/ticker/24hr`, {
                timeout: 5000 // 5 second timeout
            });

            // Filter USDT pairs and sort by quote volume (proxy for market cap)
            const data = response.data
                .filter(ticker => ticker.symbol.endsWith('USDT'))
                .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
                .slice(0, limit)
                .map(ticker => ({
                    symbol: ticker.symbol,
                    baseAsset: ticker.symbol.replace('USDT', ''),
                    price: parseFloat(ticker.lastPrice),
                    change: parseFloat(ticker.priceChange),
                    changePercent: parseFloat(ticker.priceChangePercent),
                    volume: parseFloat(ticker.volume),
                    quoteVolume: parseFloat(ticker.quoteVolume),
                    high: parseFloat(ticker.highPrice),
                    low: parseFloat(ticker.lowPrice),
                    source: 'binance'
                }));

            cacheService.set(cacheKey, data, this.cacheTTL.trending);
            return data;
        } catch (error) {
            console.log('Binance API failed, using fallback crypto data:', error.message);

            // Return fallback data
            const fallbackData = FALLBACK_CRYPTO.slice(0, limit).map(crypto => ({
                ...crypto,
                change: (crypto.price * crypto.changePercent) / 100,
                volume: crypto.quoteVolume / crypto.price,
                source: 'fallback',
                timestamp: new Date().toISOString()
            }));

            // Cache fallback for 5 minutes
            cacheService.set(cacheKey, fallbackData, 300);
            return fallbackData;
        }
    }

    /**
     * Get trending/top gainers
     */
    async getTrending(limit = 10) {
        const cacheKey = `crypto:trending:${limit}`;
        const cached = cacheService.get(cacheKey);

        if (cached) {
            return cached;
        }

        try {
            const response = await axios.get(`${this.baseURL}/ticker/24hr`);

            // Filter USDT pairs and sort by price change percentage
            const gainers = response.data
                .filter(ticker => ticker.symbol.endsWith('USDT'))
                .sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))
                .slice(0, limit)
                .map(ticker => ({
                    symbol: ticker.symbol,
                    baseAsset: ticker.symbol.replace('USDT', ''),
                    price: parseFloat(ticker.lastPrice),
                    changePercent: parseFloat(ticker.priceChangePercent),
                    volume: parseFloat(ticker.quoteVolume)
                }));

            const losers = response.data
                .filter(ticker => ticker.symbol.endsWith('USDT'))
                .sort((a, b) => parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent))
                .slice(0, limit)
                .map(ticker => ({
                    symbol: ticker.symbol,
                    baseAsset: ticker.symbol.replace('USDT', ''),
                    price: parseFloat(ticker.lastPrice),
                    changePercent: parseFloat(ticker.priceChangePercent),
                    volume: parseFloat(ticker.quoteVolume)
                }));

            const data = { gainers, losers };
            cacheService.set(cacheKey, data, this.cacheTTL.trending);
            return data;
        } catch (error) {
            throw new Error(`Failed to fetch trending cryptocurrencies: ${error.message}`);
        }
    }

    /**
     * Search cryptocurrencies
     */
    async search(query) {
        const cacheKey = `crypto:search:${query}`;
        const cached = cacheService.get(cacheKey);

        if (cached) {
            return cached;
        }

        try {
            const response = await axios.get(`${this.baseURL}/exchangeInfo`);
            const symbols = response.data.symbols;

            const searchTerm = query.toUpperCase();
            const results = symbols
                .filter(s =>
                    s.quoteAsset === 'USDT' &&
                    (s.baseAsset.includes(searchTerm) || s.symbol.includes(searchTerm))
                )
                .slice(0, 10)
                .map(s => ({
                    symbol: s.symbol,
                    baseAsset: s.baseAsset,
                    quoteAsset: s.quoteAsset,
                    status: s.status
                }));

            cacheService.set(cacheKey, results, this.cacheTTL.trending);
            return results;
        } catch (error) {
            throw new Error(`Failed to search cryptocurrencies: ${error.message}`);
        }
    }

    /**
     * Get exchange info for a symbol
     */
    async getExchangeInfo(symbol) {
        const tradingPair = symbol.toUpperCase().endsWith('USDT')
            ? symbol.toUpperCase()
            : `${symbol.toUpperCase()}USDT`;

        try {
            const response = await axios.get(`${this.baseURL}/exchangeInfo`, {
                params: { symbol: tradingPair }
            });

            return response.data.symbols[0];
        } catch (error) {
            throw new Error(`Failed to fetch exchange info for ${symbol}: ${error.message}`);
        }
    }
}

module.exports = new CryptoAPI();
