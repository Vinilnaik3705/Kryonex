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
        // Near real-time cache TTLs (in seconds)
        // Price & market data: 5s for near real-time dashboards
        // History: 30s (chart data, less critical)
        // Search: 60s (rarely changes)
        this.cacheTTL = {
            price: 5,       // Individual price lookups
            market: 5,      // Market list (top coins, trending)
            history: 30,    // Chart/kline history
            search: 60      // Symbol search results
        };
        this.activeDailyOpenPromises = new Map();
    }

    normalizeSymbol(symbol) {
        if (!symbol) return 'BTC';
        const clean = symbol.trim().toLowerCase();
        
        const map = {
            bitcoin: 'BTC', btc: 'BTC',
            ethereum: 'ETH', eth: 'ETH',
            solana: 'SOL', sol: 'SOL',
            dogecoin: 'DOGE', doge: 'DOGE',
            shiba: 'SHIB', shib: 'SHIB', shibainu: 'SHIB',
            bnb: 'BNB', binancecoin: 'BNB',
            ada: 'ADA', cardano: 'ADA',
            dot: 'DOT', polkadot: 'DOT',
            ripple: 'XRP', xrp: 'XRP',
            avalanche: 'AVAX', avax: 'AVAX',
            polygon: 'MATIC', matic: 'MATIC',
            chainlink: 'LINK', link: 'LINK',
            litecoin: 'LTC', ltc: 'LTC',
            uniswap: 'UNI', uni: 'UNI',
            cosmos: 'ATOM', atom: 'ATOM',
            etc: 'ETC', ethereumclassic: 'ETC',
            xlm: 'XLM', stellar: 'XLM',
            algo: 'ALGO', algorand: 'ALGO',
            vet: 'VET', vechain: 'VET',
            fil: 'FIL', filecoin: 'FIL',
            trx: 'TRX', tron: 'TRX'
        };

        let checkSymbol = clean;
        if (clean.endsWith('usdt')) {
            checkSymbol = clean.slice(0, -4);
        }

        if (map[checkSymbol]) {
            return map[checkSymbol];
        }
        return checkSymbol.toUpperCase();
    }

    /**
     * Fetch daily open price (since UTC 00:00) using 1d kline
     */
    async getDailyOpenPrice(symbol) {
        const normalized = this.normalizeSymbol(symbol);
        const tradingPair = `${normalized}USDT`;

        const cacheKey = `crypto:dailyOpen:${tradingPair}`;
        const cached = await cacheService.get(cacheKey);
        if (cached !== undefined && cached !== null) {
            return cached;
        }

        if (this.activeDailyOpenPromises.has(cacheKey)) {
            return this.activeDailyOpenPromises.get(cacheKey);
        }

        const promise = (async () => {
            try {
                const response = await axios.get(`${this.baseURL}/klines`, {
                    params: {
                        symbol: tradingPair,
                        interval: '1d',
                        limit: 1
                    }
                });
                if (response.data && response.data.length > 0) {
                    const openPrice = parseFloat(response.data[0][1]); // Index 1 is open price
                    // Cache for 1 hour
                    await cacheService.set(cacheKey, openPrice, 3600);
                    return openPrice;
                }
            } catch (error) {
                console.error(`Failed to fetch daily open price for ${tradingPair}:`, error.message);
            } finally {
                this.activeDailyOpenPromises.delete(cacheKey);
            }
            return null;
        })();

        this.activeDailyOpenPromises.set(cacheKey, promise);
        return promise;
    }

    /**
     * Get real-time crypto price
     */
    async getPrice(symbol) {
        // Normalize symbol (e.g., BTC -> BTCUSDT)
        const normalized = this.normalizeSymbol(symbol);
        const tradingPair = `${normalized}USDT`;

        // Check cache first (5s TTL for near real-time)
        const cacheKey = `crypto:price:${tradingPair}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            // Get 24hr ticker data
            const response = await axios.get(`${this.baseURL}/ticker/24hr`, {
                params: { symbol: tradingPair }
            });

            const ticker = response.data;
            const lastPrice = parseFloat(ticker.lastPrice);

            // Calculate daily price change percentage relative to midnight UTC open price
            const dailyOpen = await this.getDailyOpenPrice(tradingPair);
            let change = parseFloat(ticker.priceChange);
            let changePercent = parseFloat(ticker.priceChangePercent);

            if (dailyOpen) {
                change = lastPrice - dailyOpen;
                changePercent = (change / dailyOpen) * 100;
            }

            const data = {
                symbol: tradingPair,
                baseAsset: normalized,
                price: lastPrice,
                change: change,
                changePercent: changePercent,
                volume: parseFloat(ticker.volume),
                quoteVolume: parseFloat(ticker.quoteVolume),
                high: parseFloat(ticker.highPrice),
                low: parseFloat(ticker.lowPrice),
                open: dailyOpen || parseFloat(ticker.openPrice),
                previousClose: parseFloat(ticker.prevClosePrice),
                trades: ticker.count,
                timestamp: new Date(ticker.closeTime).toISOString()
            };

            await cacheService.set(cacheKey, data, this.cacheTTL.price);
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
        const normalized = this.normalizeSymbol(symbol);
        const tradingPair = `${normalized}USDT`;

        const cacheKey = `crypto:history:${tradingPair}:${interval}:${limit}`;
        const cached = await cacheService.get(cacheKey);

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

            await cacheService.set(cacheKey, data, this.cacheTTL.history); // 30s cache
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
        const cached = await cacheService.get(cacheKey);

        if (cached) {
            return cached;
        }

        try {
            // Try to get real data from Binance
            const response = await axios.get(`${this.baseURL}/ticker/24hr`, {
                timeout: 5000 // 5 second timeout
            });

            // Filter USDT pairs and sort by quote volume (proxy for market cap)
            const rawTickers = response.data
                .filter(ticker => ticker.symbol.endsWith('USDT'))
                .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
                .slice(0, limit);

            const data = await Promise.all(
                rawTickers.map(async (ticker) => {
                    const lastPrice = parseFloat(ticker.lastPrice);
                    const dailyOpen = await this.getDailyOpenPrice(ticker.symbol);
                    
                    let change = parseFloat(ticker.priceChange);
                    let changePercent = parseFloat(ticker.priceChangePercent);

                    if (dailyOpen) {
                        change = lastPrice - dailyOpen;
                        changePercent = (change / dailyOpen) * 100;
                    }

                    return {
                        symbol: ticker.symbol,
                        baseAsset: ticker.symbol.replace('USDT', ''),
                        price: lastPrice,
                        change: change,
                        changePercent: changePercent,
                        volume: parseFloat(ticker.volume),
                        quoteVolume: parseFloat(ticker.quoteVolume),
                        high: parseFloat(ticker.highPrice),
                        low: parseFloat(ticker.lowPrice),
                        source: 'binance'
                    };
                })
            );

            await cacheService.set(cacheKey, data, this.cacheTTL.market); // 5s cache for near real-time
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
            await cacheService.set(cacheKey, fallbackData, 30); // Short cache for fallback too
            return fallbackData;
        }
    }

    /**
     * Get trending/top gainers
     */
    async getTrending(limit = 10) {
        const cacheKey = `crypto:trending:${limit}`;
        const cached = await cacheService.get(cacheKey);

        if (cached) {
            return cached;
        }

        try {
            const response = await axios.get(`${this.baseURL}/ticker/24hr`);

            // Filter USDT pairs and sort by price change percentage
            const rawGainers = response.data
                .filter(ticker => ticker.symbol.endsWith('USDT'))
                .sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))
                .slice(0, limit);

            const rawLosers = response.data
                .filter(ticker => ticker.symbol.endsWith('USDT'))
                .sort((a, b) => parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent))
                .slice(0, limit);

            const gainers = await Promise.all(
                rawGainers.map(async (ticker) => {
                    const lastPrice = parseFloat(ticker.lastPrice);
                    const dailyOpen = await this.getDailyOpenPrice(ticker.symbol);
                    
                    let changePercent = parseFloat(ticker.priceChangePercent);

                    if (dailyOpen) {
                        changePercent = ((lastPrice - dailyOpen) / dailyOpen) * 100;
                    }

                    return {
                        symbol: ticker.symbol,
                        baseAsset: ticker.symbol.replace('USDT', ''),
                        price: lastPrice,
                        changePercent: changePercent,
                        volume: parseFloat(ticker.quoteVolume)
                    };
                })
            );

            const losers = await Promise.all(
                rawLosers.map(async (ticker) => {
                    const lastPrice = parseFloat(ticker.lastPrice);
                    const dailyOpen = await this.getDailyOpenPrice(ticker.symbol);
                    
                    let changePercent = parseFloat(ticker.priceChangePercent);

                    if (dailyOpen) {
                        changePercent = ((lastPrice - dailyOpen) / dailyOpen) * 100;
                    }

                    return {
                        symbol: ticker.symbol,
                        baseAsset: ticker.symbol.replace('USDT', ''),
                        price: lastPrice,
                        changePercent: changePercent,
                        volume: parseFloat(ticker.quoteVolume)
                    };
                })
            );

            const data = { gainers, losers };
            await cacheService.set(cacheKey, data, this.cacheTTL.market); // 5s cache for near real-time
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
        const cached = await cacheService.get(cacheKey);

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

            await cacheService.set(cacheKey, results, this.cacheTTL.search); // 60s cache for search
            return results;
        } catch (error) {
            throw new Error(`Failed to search cryptocurrencies: ${error.message}`);
        }
    }

    /**
     * Get exchange info for a symbol
     */
    async getExchangeInfo(symbol) {
        const normalized = this.normalizeSymbol(symbol);
        const tradingPair = `${normalized}USDT`;

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
