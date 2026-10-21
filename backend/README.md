# Trading Platform Backend

A comprehensive backend API for accessing real-time and historical data for stocks, ETFs, and cryptocurrencies.

## 🚀 Quick Start

### Installation

```bash
cd backend
npm install
```

### Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. (Optional) Update `.env` with your preferences. The defaults work out of the box.

For persistent signed-in trading state, set `MONGO_URI`. When MongoDB is unavailable, local development uses the ignored `SIMULATION_DATA_FILE` fallback (default: `backend/data/simulation-state.json`).

### Running the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on **http://localhost:5000**

The API root at `GET /api` returns the active API groups and `GET /health` can be used as a deployment smoke check.

## 📊 Data Sources

- **Stocks & ETFs**: Yahoo Finance (via `yahoo-finance2` npm package)
- **Cryptocurrency**: Binance Public API

Both sources are **free** and require **no API keys** for basic usage.

## 🔗 API Endpoints

### Health Check
```bash
GET /health
```

### Stocks
- `GET /api/stocks/quote/:symbol` - Real-time quote
- `GET /api/stocks/history/:symbol` - Historical data
- `GET /api/stocks/search?q=query` - Search stocks
- `GET /api/stocks/movers` - Top gainers/losers
- `GET /api/stocks/batch?symbols=AAPL,MSFT,GOOGL` - Batch quotes

### ETFs
- `GET /api/etfs/quote/:symbol` - Real-time quote
- `GET /api/etfs/history/:symbol` - Historical data
- `GET /api/etfs/search?q=query` - Search ETFs
- `GET /api/etfs/popular` - Popular ETFs
- `GET /api/etfs/holdings/:symbol` - ETF holdings
- `GET /api/etfs/batch?symbols=SPY,QQQ,IWM` - Batch quotes

### Cryptocurrency
- `GET /api/crypto/price/:symbol` - Real-time price
- `GET /api/crypto/history/:symbol` - Historical data
- `GET /api/crypto/trending` - Top gainers/losers
- `GET /api/crypto/market-cap` - Top by market cap
- `GET /api/crypto/search?q=query` - Search crypto
- `GET /api/crypto/batch?symbols=BTC,ETH,BNB` - Batch prices
- `GET /api/crypto/info/:symbol` - Exchange info

## 📖 Full Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference with examples.

## 🏗️ Project Structure

```
backend/
├── server.js                 # Main Express server
├── package.json             # Dependencies
├── .env.example             # Environment template
├── api-integration/         # API integration layer
│   ├── stocksAPI.js        # Yahoo Finance stocks
│   ├── etfsAPI.js          # Yahoo Finance ETFs
│   ├── cryptoAPI.js        # Binance crypto
│   └── dataModels.js       # Data normalization
├── routes/                  # Express routes
│   ├── stockRoutes.js
│   ├── etfRoutes.js
│   └── cryptoRoutes.js
├── services/                # Business logic
│   ├── cacheService.js     # Response caching
│   └── dataAggregator.js   # Multi-source aggregation
└── middleware/              # Express middleware
    ├── errorHandler.js     # Error handling
    └── rateLimiter.js      # Rate limiting
```

## ⚡ Features

- **Multi-Asset Support**: Stocks, ETFs, and Cryptocurrencies
- **Real-time Data**: Live quotes and prices
- **Historical Data**: Candlestick/OHLCV data with configurable intervals
- **Smart Caching**: Reduces API calls and improves performance
- **Rate Limiting**: Protects against abuse
- **Error Handling**: Comprehensive error responses
- **CORS Enabled**: Ready for frontend integration
- **Data Aggregation**: Combine multiple asset types

## 🧪 Testing

Test endpoints using curl, Postman, or your browser:

```bash
# Health check
curl http://localhost:5000/health

# Stock quote
curl http://localhost:5000/api/stocks/quote/AAPL

# Crypto price
curl http://localhost:5000/api/crypto/price/BTC

# ETF quote
curl http://localhost:5000/api/etfs/quote/SPY
```

## 🔧 Configuration

Environment variables in `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Server port |
| `NODE_ENV` | development | Environment |
| `FRONTEND_URL` | http://localhost:5173 | CORS origin |
| `CACHE_TTL_QUOTE` | 60 | Quote cache TTL (seconds) |
| `CACHE_TTL_HISTORY` | 300 | History cache TTL (seconds) |
| `CACHE_TTL_SEARCH` | 600 | Search cache TTL (seconds) |
| `RATE_LIMIT_WINDOW_MS` | 60000 | Rate limit window (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |

## 📝 Notes

- Yahoo Finance may rate limit requests during high usage
- Binance public API has no authentication required
- All timestamps are in ISO 8601 format
- Prices are in USD (stocks/ETFs) or USDT (crypto)

## 🤝 Integration with Frontend

Update your frontend to point to:
```javascript
const API_BASE_URL = 'http://localhost:5000';
```

The backend is configured to accept requests from `http://localhost:5173` by default.

## 📄 License

ISC
