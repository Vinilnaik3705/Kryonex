const express = require('express');
const axios = require('axios');

const router = express.Router();

const paypalBaseUrl = process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const getPayPalAccessToken = async () => {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
        throw new Error('PayPal credentials are not configured');
    }

    const response = await axios.post(
        `${paypalBaseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
            auth: {
                username: process.env.PAYPAL_CLIENT_ID,
                password: process.env.PAYPAL_CLIENT_SECRET,
            },
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
    );

    return response.data.access_token;
};

router.post('/create-order', async (req, res) => {
    try {
        const { amount, currency = 'USD', receipt, notes = {} } = req.body;
        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ success: false, message: 'A valid payment amount is required' });
        }

        const accessToken = await getPayPalAccessToken();
        const response = await axios.post(
            `${paypalBaseUrl}/v2/checkout/orders`,
            {
                intent: 'CAPTURE',
                purchase_units: [{
                    invoice_id: receipt || `receipt_${Date.now()}`,
                    custom_id: JSON.stringify(notes).slice(0, 127),
                    amount: {
                        currency_code: currency.toUpperCase(),
                        value: numericAmount.toFixed(2),
                    },
                }],
                application_context: {
                    user_action: 'PAY_NOW',
                    return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment`,
                    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment?cancelled=true`,
                },
            },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const approvalLink = response.data.links?.find((link) => link.rel === 'approve')?.href;

        res.json({
            success: true,
            order: response.data,
            approvalUrl: approvalLink,
        });
    } catch (error) {
        console.error('Error creating PayPal order:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.response?.data?.message || error.message,
        });
    }
});

router.post('/capture-order', async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'PayPal order ID is required' });
        }

        const accessToken = await getPayPalAccessToken();
        const response = await axios.post(
            `${paypalBaseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
            {},
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const capture = response.data.purchase_units?.[0]?.payments?.captures?.[0];
        return res.json({
            success: response.data.status === 'COMPLETED' && capture?.status === 'COMPLETED',
            message: response.data.status === 'COMPLETED' ? 'Payment captured successfully' : 'Payment was not completed',
            order: response.data,
        });
    } catch (error) {
        console.error('Error capturing PayPal order:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Payment capture failed',
            error: error.response?.data?.message || error.message,
        });
    }
});

router.get('/order/:orderId', async (req, res) => {
    try {
        const accessToken = await getPayPalAccessToken();
        const response = await axios.get(
            `${paypalBaseUrl}/v2/checkout/orders/${encodeURIComponent(req.params.orderId)}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        res.json({
            success: true,
            order: response.data,
        });
    } catch (error) {
        console.error('Error fetching PayPal order:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch PayPal order',
            error: error.response?.data?.message || error.message,
        });
    }
});

module.exports = router;
