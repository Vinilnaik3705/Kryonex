const express = require('express');
const axios = require('axios');

const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are Kryonex AI, an elite cryptocurrency analyst AI embedded in the Kryonex trading platform.

Your job: help users decide if a crypto coin is SAFE or RISKY to invest in right now.

For every coin analysis, you MUST research and cover:
1. **Recent price action** — last 24h, 7d, 30d, 1yr trend if available
2. **News & Events** — search for the latest headlines about this coin
3. **Political/Macro factors** — check if major politicians (Trump, SEC officials, world leaders) have recently spoken about crypto or this coin; check for regulatory developments
4. **War/Crisis impact** — if there are active geopolitical conflicts, explain how they affect this coin (BTC is often seen as a safe-haven; altcoins may dump during crisis)
5. **On-chain/Community signals** — developer activity, whale movements, social sentiment
6. **Risk verdict** — end EVERY analysis with a clear verdict block in this exact format:

---VERDICT---
RISK_LEVEL: [HIGH / MEDIUM / LOW]
SAFE_TO_INVEST: [YES / NO / CAUTION]
CONFIDENCE: [number 0-100]
ONE_LINE: [one punchy sentence summing up the call]
---END---

When the user just asks a follow-up question or chats generally, respond naturally — only output the verdict block when you're doing a full coin analysis or the user asks for a risk assessment.

Be specific with numbers. Be direct. Speak like a sharp Bloomberg analyst, not a textbook. If live data is unavailable, be transparent about that limitation.

Keep responses concise but data-rich. Use **bold** for key numbers and terms. Use bullet points for lists.`;

router.post('/crypto-chat', async (req, res) => {
    try {
        const { messages } = req.body || {};

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'messages must be a non-empty array'
            });
        }

        const providerMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages,
        ];

        const requestBody = {
            temperature: 0.4,
            max_tokens: 1500,
            messages: providerMessages,
        };

        if (!GROQ_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'No AI provider key is configured on the backend. Set GROQ_API_KEY.',
            });
        }

        const response = await axios.post(
            GROQ_ENDPOINT,
            {
                ...requestBody,
                model: 'llama-3.3-70b-versatile',
            },
            {
                headers: {
                    'content-type': 'application/json',
                    Authorization: `Bearer ${GROQ_API_KEY}`,
                },
                timeout: 90000,
            }
        );

        return res.json({
            success: true,
            content: response.data?.choices?.[0]?.message?.content?.trim() || '',
        });
    } catch (error) {
        console.error('AI route error:', error?.response?.data || error.message || error);
        return res.status(error?.response?.status || 500).json({
            success: false,
            error: error?.response?.data?.error?.message || error.message || 'Failed to generate analysis',
        });
    }
});

module.exports = router;