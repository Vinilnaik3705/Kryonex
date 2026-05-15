const axios = require('axios');
const Parser = require('rss-parser');
const crypto = require('crypto');

const parser = new Parser({
    customFields: {
        item: ['media:content', 'media:thumbnail']
    }
});

/**
 * Generate a consistent ID from article URL
 */
function generateArticleId(url) {
    return crypto.createHash('md5').update(url).digest('hex').substring(0, 12);
}

// RSS Feed sources for crypto news only
const RSS_FEEDS = {
    crypto: [
        'https://www.coindesk.com/arc/outboundfeeds/rss/',
        'https://cointelegraph.com/rss',
        'https://decrypt.co/feed'
    ]
};

/**
 * Fetch crypto news from RSS feeds
 * @param {string} category - crypto only
 * @param {number} limit - Number of articles to fetch
 */
async function getFinancialNews(category = 'crypto', limit = 20) {
    try {
        const feeds = RSS_FEEDS.crypto;
        const allArticles = [];

        // Fetch from multiple RSS feeds in parallel
        const feedPromises = feeds.map(async (feedUrl) => {
            try {
                const feed = await parser.parseURL(feedUrl);
                return feed.items.map(item => ({
                    id: generateArticleId(item.link || item.title),
                    title: item.title || 'Untitled',
                    description: item.contentSnippet || item.content || item.summary || '',
                    content: item.content || item.contentSnippet || item.summary || '',
                    source: feed.title || extractDomain(feedUrl),
                    author: item.creator || item.author || 'Staff Writer',
                    url: item.link || '#',
                    image: item.enclosure?.url || item['media:content']?.$ || null,
                    publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
                    category: categorizeArticle(item.title + ' ' + (item.contentSnippet || ''))
                }));
            } catch (error) {
                console.error(`Failed to fetch RSS feed ${feedUrl}:`, error.message);
                return [];
            }
        });

        const feedResults = await Promise.all(feedPromises);
        feedResults.forEach(articles => allArticles.push(...articles));

        // Sort by publish date (newest first)
        allArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        const cryptoArticles = allArticles.filter((article) => article.category === 'Crypto');

        // Return limited results
        return {
            success: true,
            data: cryptoArticles.slice(0, limit),
            totalResults: cryptoArticles.length,
            source: 'RSS Feeds'
        };
    } catch (error) {
        console.error('RSS Feed Error:', error.message);
        return getFallbackNews();
    }
}

/**
 * Extract domain name from URL
 */
function extractDomain(url) {
    try {
        const domain = new URL(url).hostname;
        return domain.replace('www.', '').replace('.com', '').toUpperCase();
    } catch {
        return 'News';
    }
}

/**
 * Categorize article based on content
 */
function categorizeArticle(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('bitcoin') || lowerText.includes('crypto') || lowerText.includes('ethereum') || lowerText.includes('blockchain')) {
        return 'Crypto';
    } else if (lowerText.includes('stock') || lowerText.includes('nasdaq') || lowerText.includes('s&p') || lowerText.includes('dow')) {
        return 'Stocks';
    } else if (lowerText.includes('oil') || lowerText.includes('gold') || lowerText.includes('commodity') || lowerText.includes('crude')) {
        return 'Commodities';
    } else if (lowerText.includes('fed') || lowerText.includes('inflation') || lowerText.includes('gdp') || lowerText.includes('economy')) {
        return 'Economy';
    } else if (lowerText.includes('europe') || lowerText.includes('asia') || lowerText.includes('global') || lowerText.includes('china')) {
        return 'Global';
    } else {
        return 'Markets';
    }
}

/**
 * Fallback news when RSS feeds are unavailable
 */
function getFallbackNews() {
    const now = new Date();
    return {
        success: true,
        data: [
            {
                id: 'fallback-1',
                title: 'Bitcoin Leads a Fresh Crypto Rally',
                description: 'Bitcoin pushes higher as traders price in stronger ETF flows.',
                content: 'Bitcoin and major altcoins are moving higher as institutional flows remain steady and liquidity improves across exchanges.',
                source: 'Crypto News',
                author: 'Editorial Team',
                url: '#',
                image: null,
                publishedAt: now.toISOString(),
                category: 'Crypto'
            },
            {
                id: 'fallback-2',
                title: 'Ethereum Activity Accelerates Across DeFi',
                description: 'On-chain activity and fee revenue are improving for ETH.',
                content: 'Ethereum is seeing stronger on-chain activity, with DeFi usage and staking participation supporting broader market sentiment.',
                source: 'Crypto News',
                author: 'Editorial Team',
                url: '#',
                image: null,
                publishedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
                category: 'Crypto'
            },
            {
                id: 'fallback-3',
                title: 'Altcoins Outperform as Risk Appetite Returns',
                description: 'Smaller-cap tokens are leading the move higher.',
                content: 'Altcoins are outperforming as traders rotate into higher-beta crypto assets, with meme coins and L1 ecosystems seeing renewed attention.',
                source: 'Crypto News',
                author: 'Editorial Team',
                url: '#',
                image: null,
                publishedAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
                category: 'Crypto'
            }
        ],
        totalResults: 3,
        fallback: true
    };
}

module.exports = {
    getFinancialNews
};
