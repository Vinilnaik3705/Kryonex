const cryptoAPI = require('../api-integration/cryptoAPI');
const { normalizeCryptoData } = require('../api-integration/dataModels');

/**
 * Data aggregator service for cryptocurrency data
 */
class DataAggregator {
    /**
     * Get mixed portfolio data (only crypto supported now)
     */
    async getPortfolioData(symbols) {
        const results = await Promise.allSettled(
            symbols.map(async (item) => {
                const { symbol, type } = item;

                try {
                    if (type.toLowerCase() !== 'crypto') {
                        throw new Error(`Asset type no longer supported: ${type}`);
                    }
                    const cryptoData = await cryptoAPI.getPrice(symbol);
                    return normalizeCryptoData(cryptoData);
                } catch (error) {
                    return {
                        symbol,
                        type,
                        error: error.message
                    };
                }
            })
        );

        return results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                return {
                    symbol: symbols[index].symbol,
                    type: symbols[index].type,
                    error: result.reason.message
                };
            }
        });
    }

    /**
     * Get market overview (top crypto only)
     */
    async getMarketOverview() {
        try {
            const topCrypto = await cryptoAPI.getTopByMarketCap(5);

            return {
                crypto: topCrypto,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to fetch market overview: ${error.message}`);
        }
    }

    /**
     * Search across cryptocurrency
     */
    async searchAll(query) {
        const crypto = await cryptoAPI.search(query).catch(() => []);

        return {
            crypto: crypto || []
        };
    }

    /**
     * Calculate portfolio statistics
     */
    calculatePortfolioStats(portfolioData) {
        const validData = portfolioData.filter(item => !item.error);

        if (validData.length === 0) {
            return {
                totalValue: 0,
                totalChange: 0,
                totalChangePercent: 0,
                assetCount: 0
            };
        }

        const totalValue = validData.reduce((sum, item) => sum + (item.price || 0), 0);
        const totalChange = validData.reduce((sum, item) => sum + (item.change || 0), 0);
        const avgChangePercent = validData.reduce((sum, item) => sum + (item.changePercent || 0), 0) / validData.length;

        return {
            totalValue,
            totalChange,
            totalChangePercent: avgChangePercent,
            assetCount: validData.length,
            byType: {
                crypto: validData.filter(i => i.type === 'crypto').length
            }
        };
    }
}

module.exports = new DataAggregator();
