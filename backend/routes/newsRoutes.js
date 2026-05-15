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
        const { limit = 20 } = req.query;
        const news = await newsAPI.getFinancialNews('crypto', parseInt(limit));
        res.json(news);
    } catch (error) {
        console.error('News route error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch news',
            message: error.message
        });
    }
});

module.exports = router;
