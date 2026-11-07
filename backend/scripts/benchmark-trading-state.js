require('dotenv').config();
const axios = require('axios');

const baseURL = (process.env.TRADING_API_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, '');
const token = process.env.TRADING_TOKEN;

if (!token) {
    console.error('Set TRADING_TOKEN to a valid Supabase access token before running this benchmark.');
    process.exit(1);
}

(async () => {
    for (let index = 1; index <= 5; index += 1) {
        const startedAt = Date.now();
        await axios.get(`${baseURL}/api/trading/state`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000,
        });
        console.log(`request ${index}: ${Date.now() - startedAt}ms`);
    }
})().catch((error) => {
    console.error(`Trading state benchmark failed: ${error.response?.data?.error || error.message}`);
    process.exit(1);
});
