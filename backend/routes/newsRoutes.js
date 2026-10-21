const express = require('express');
const router = express.Router();
const newsAPI = require('../api-integration/newsAPI');

/**
 * GET /api/news
 * Get crypto news articles
 * Query params:
 *   - limit: number of articles (default: 20)
 */
router.get('/', async (req, res) => {
    try {
        const requestedLimit = Number.parseInt(req.query.limit, 10);
        const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 30) : 20;
        const news = await newsAPI.getFinancialNews('crypto', limit);
        res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=90');
        res.json(news);
    } catch (error) {
        console.error('News route error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch news',
            message: 'News service temporarily unavailable'
        });
    }
});

module.exports = router;
