const express = require('express');
const router = express.Router();
const axios = require('axios');

let logoCache = {};
let lastFetched = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

async function fetchAllLogos() {
  if (Date.now() - lastFetched < CACHE_TTL && Object.keys(logoCache).length > 0) {
    return logoCache;
  }
  // CoinGecko /coins/markets — fetch top 500 by market cap, covers virtually all Binance coins
  const pages = [1, 2, 3, 4, 5]; // 5 pages × 100 = 500 coins
  const results = await Promise.all(pages.map(page =>
    axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 100,
        page,
        sparkline: false,
      },
      headers: { 'Accept': 'application/json' },
    }).then(r => r.data).catch(() => [])
  ));

  const flat = results.flat();
  logoCache = {};
  flat.forEach(coin => {
    const sym = coin.symbol.toUpperCase();
    logoCache[sym] = coin.image; // full URL like https://assets.coingecko.com/coins/images/.../thumb.png
  });

  lastFetched = Date.now();
  console.log(`Coin logos cached: ${Object.keys(logoCache).length} coins`);
  return logoCache;
}

// GET /api/coin-logos — returns { BTC: "url", ETH: "url", PEPE: "url", ... }
router.get('/', async (req, res) => {
  try {
    const logos = await fetchAllLogos();
    res.json(logos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logos' });
  }
});

module.exports = router;
