import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import { CreditCard, Smartphone, Building2, Wallet, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const Payment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null); // 'success' or 'failed'

    // Get order details from navigation state
    const orderDetails = location.state || {
        amount: 0,
        assetName: 'Unknown',
        assetSymbol: 'N/A',
        quantity: 0,
        type: 'crypto' // 'crypto' or 'subscription'
    };

    useEffect(() => {
        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handlePayment = async () => {
        setLoading(true);
        try {
            // Create order
            const orderData = {
                amount: orderDetails.amount,
                currency: 'INR',
                receipt: `receipt_${Date.now()}`,
                notes: {
                    assetName: orderDetails.assetName,
                    assetSymbol: orderDetails.assetSymbol,
                    quantity: orderDetails.quantity,
                    type: orderDetails.type
                }
            };

            const { order, key_id } = await paymentService.createOrder(orderData);

            // Razorpay options
            const options = {
                key: key_id,
                amount: order.amount,
                currency: order.currency,
                name: 'Kryonex Pro',
                description: `${orderDetails.type === 'subscription' ? 'Pro Subscription' : `Purchase ${orderDetails.quantity} ${orderDetails.assetSymbol}`}`,
                order_id: order.id,
                handler: async function (response) {
                    // Payment successful
                    try {
                        const verifyData = await paymentService.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyData.success) {
                            setPaymentStatus('success');
                            setTimeout(() => {
                                navigate('/dashboard');
                            }, 3000);
                        }
                    } catch (error) {
                        setPaymentStatus('failed');
                    }
                },
                prefill: {
                    name: '',
                    email: '',
                    contact: ''
                },
                theme: {
                    color: '#2962FF'
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                setPaymentStatus('failed');
                setLoading(false);
            });

            rzp.open();
            setLoading(false);
        } catch (error) {
            console.error('Payment error:', error);
            setPaymentStatus('failed');
            setLoading(false);
        }
    };

    if (paymentStatus === 'success') {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle size={48} className="text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Payment Successful!</h1>
                    <p className="text-gray-600">Your transaction has been completed successfully.</p>
                    <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
                </div>
            </div>
        );
    }

    if (paymentStatus === 'failed') {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <XCircle size={48} className="text-red-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Payment Failed</h1>
                    <p className="text-gray-600">There was an issue processing your payment.</p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => setPaymentStatus(null)}
                            className="px-6 py-3 bg-[#2962FF] text-white rounded-lg font-medium hover:bg-[#1e4bd1] transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={24} className="text-gray-700" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Order Summary */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
                            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Item</span>
                                    <span className="font-semibold text-gray-900">
                                        {orderDetails.type === 'subscription' ? 'Pro Subscription' : orderDetails.assetName}
                                    </span>
                                </div>
                                {orderDetails.type !== 'subscription' && (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Symbol</span>
                                            <span className="font-mono text-gray-900">{orderDetails.assetSymbol}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Quantity</span>
                                            <span className="font-semibold text-gray-900">{orderDetails.quantity}</span>
                                        </div>
                                    </>
                                )}
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-gray-900">Total Amount</span>
                                        <span className="text-2xl font-bold text-[#2962FF]">
                                            ₹{orderDetails.amount.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Methods Info */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Supported Payment Methods</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer border border-transparent hover:border-blue-200">
                                    <div className="flex -space-x-2">
                                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center p-1">
                                            <img src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/google-pay-icon.png" alt="GPay" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center p-1">
                                            <img src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/phonepe-icon.png" alt="PhonePe" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center p-1">
                                            <img src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/paytm-icon.png" alt="Paytm" className="w-full h-full object-contain" />
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">UPI Apps</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                    <CreditCard className="text-[#2962FF]" size={24} />
                                    <span className="text-sm font-medium text-gray-700">Cards</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                    <Building2 className="text-[#2962FF]" size={24} />
                                    <span className="text-sm font-medium text-gray-700">Net Banking</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                    <Wallet className="text-[#2962FF]" size={24} />
                                    <span className="text-sm font-medium text-gray-700">Wallets</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Action */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-[#2962FF] to-[#1e4bd1] rounded-2xl p-8 text-white space-y-6">
                            <h2 className="text-2xl font-bold">Secure Payment</h2>
                            <p className="text-blue-100">
                                Your payment is secured by Razorpay. We support all major payment methods in India.
                            </p>
                            <button
                                onClick={handlePayment}
                                disabled={loading}
                                className="w-full bg-white text-[#2962FF] py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing...' : 'Proceed to Pay'}
                            </button>
                            <div className="flex items-center justify-center gap-2 text-sm text-blue-100">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                <span>Design by Kryonex</span>
                            </div>
                        </div>

                        {/* Test Mode Info */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">
                                <strong>Test Mode:</strong> Use test UPI ID or test card numbers for testing.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
