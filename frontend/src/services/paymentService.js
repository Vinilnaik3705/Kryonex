import API_BASE_URL from '../config/api';

const API_URL = `${API_BASE_URL}/payment`;

export const paymentService = {
    // Create Razorpay order
    createOrder: async (orderData) => {
        try {
            const response = await fetch(`${API_URL}/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create order');
            }

            return data;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    },

    // Capture an approved PayPal order
    captureOrder: async (orderId) => {
        try {
            const response = await fetch(`${API_URL}/capture-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Payment capture failed');
            }

            return data;
        } catch (error) {
            console.error('Error capturing PayPal order:', error);
            throw error;
        }
    },

    // Get payment details
    getPaymentDetails: async (paymentId) => {
        try {
            const response = await fetch(`${API_URL}/payment/${paymentId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch payment details');
            }

            return data;
        } catch (error) {
            console.error('Error fetching payment details:', error);
            throw error;
        }
    }
};
