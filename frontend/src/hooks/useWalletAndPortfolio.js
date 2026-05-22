import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { useAuth } from '../context/AuthContext';
import { buildUserScopedStorageKey } from '../utils/storage';

const INITIAL_BALANCE = 100000; // Starting capital for trading simulator
const WALLET_KEY = 'wallet_balance';
const PORTFOLIO_KEY = 'portfolio_holdings';

/**
 * Custom hook for managing wallet balance and portfolio holdings
 * Handles buy/sell transactions, balance tracking, and P&L calculations
 */
export const useWalletAndPortfolio = () => {
    const { user, getToken } = useAuth();
    const walletStorageKey = buildUserScopedStorageKey(WALLET_KEY, user?.id);
    const portfolioStorageKey = buildUserScopedStorageKey(PORTFOLIO_KEY, user?.id);

    const [walletBalance, setWalletBalance] = useState(INITIAL_BALANCE);
    const [portfolioHoldings, setPortfolioHoldings] = useState([]);
    const [storageReady, setStorageReady] = useState(false);

    const [livePrices, setLivePrices] = useState({});
    const lastKnownPricesRef = useRef({}); // Persists last successfully fetched prices across re-renders
    const syncTimerRef = useRef(null);

    useEffect(() => {
        let isActive = true;

        setStorageReady(false);

        try {
            const storedWallet = localStorage.getItem(walletStorageKey);
            const storedPortfolio = localStorage.getItem(portfolioStorageKey);

            const nextWalletBalance = storedWallet !== null ? Number(storedWallet) : INITIAL_BALANCE;
            const parsedPortfolio = storedPortfolio ? JSON.parse(storedPortfolio) : [];
            const nextPortfolio = Array.isArray(parsedPortfolio)
                ? parsedPortfolio.filter((holding) => (holding.type || 'crypto') === 'crypto')
                : [];

            if (storedWallet === null) {
                localStorage.setItem(walletStorageKey, INITIAL_BALANCE.toString());
            }

            if (storedPortfolio === null) {
                localStorage.setItem(portfolioStorageKey, JSON.stringify([]));
            }

            if (isActive) {
                setWalletBalance(Number.isFinite(nextWalletBalance) ? nextWalletBalance : INITIAL_BALANCE);
                setPortfolioHoldings(nextPortfolio);
                setStorageReady(true);
            }
        } catch (e) {
            console.error('Failed to load trading state:', e);
            if (isActive) {
                setWalletBalance(INITIAL_BALANCE);
                setPortfolioHoldings([]);
                setStorageReady(true);
            }
        }

        return () => {
            isActive = false;
        };
    }, [walletStorageKey, portfolioStorageKey]);

    const getAuthHeaders = useCallback(async () => {
        const token = await getToken?.();
        if (!token) return {};
        return { Authorization: `Bearer ${token}` };
    }, [getToken]);

    useEffect(() => {
        let cancelled = false;

        const loadRemoteState = async () => {
            if (!user?.id || !getToken) return;

            try {
                const headers = await getAuthHeaders();
                if (!headers.Authorization) return;

                const response = await axios.get(`${API_BASE_URL}/simulation/state`, { headers });
                const remote = response.data?.data || {};

                if (cancelled) return;

                const remoteWallet = Number(remote.walletBalance);
                const remotePortfolio = Array.isArray(remote.portfolioHoldings) ? remote.portfolioHoldings : [];

                if (Number.isFinite(remoteWallet)) {
                    setWalletBalance(remoteWallet);
                }
                setPortfolioHoldings(remotePortfolio.filter((holding) => (holding.type || 'crypto') === 'crypto'));
                setStorageReady(true);
            } catch (error) {
                console.warn('Remote simulation state load failed, falling back to local storage:', error?.message || error);
            }
        };

        loadRemoteState();

        return () => {
            cancelled = true;
        };
    }, [user?.id, getToken, getAuthHeaders]);

    // Persist wallet balance to localStorage
    useEffect(() => {
        if (!storageReady) return;

        try {
            localStorage.setItem(walletStorageKey, walletBalance.toString());
        } catch (e) {
            console.error('Failed to save wallet balance:', e);
        }
    }, [walletBalance, storageReady, walletStorageKey]);

    // Persist portfolio to localStorage
    useEffect(() => {
        if (!storageReady) return;

        try {
            const cryptoHoldings = portfolioHoldings.filter((holding) => (holding.type || 'crypto') === 'crypto');
            localStorage.setItem(portfolioStorageKey, JSON.stringify(cryptoHoldings));
        } catch (e) {
            console.error('Failed to save portfolio:', e);
        }
    }, [portfolioHoldings, storageReady, portfolioStorageKey]);

    useEffect(() => {
        if (!storageReady || !user?.id) return undefined;

        const syncRemoteState = async () => {
            try {
                const headers = await getAuthHeaders();
                if (!headers.Authorization) return;

                await axios.put(
                    `${API_BASE_URL}/simulation/state`,
                    {
                        walletBalance,
                        portfolioHoldings,
                    },
                    { headers }
                );
            } catch (error) {
                console.warn('Failed to sync simulation state to backend:', error?.message || error);
            }
        };

        if (syncTimerRef.current) {
            clearTimeout(syncTimerRef.current);
        }

        syncTimerRef.current = setTimeout(syncRemoteState, 800);

        return () => {
            if (syncTimerRef.current) {
                clearTimeout(syncTimerRef.current);
            }
        };
    }, [walletBalance, portfolioHoldings, storageReady, user?.id, getAuthHeaders]);

    // Fetch live prices for all holdings — parallel with last-known-good-price fallback
    useEffect(() => {
        const fetchPrices = async () => {
            if (portfolioHoldings.length === 0) {
                setLivePrices({});
                return;
            }

            try {
                const uniqueSymbols = [...new Set(portfolioHoldings.map(h => h.symbol))];

                // Fetch all prices in parallel for speed
                const results = await Promise.allSettled(
                    uniqueSymbols.map(async (symbol) => {
                        const endpoint = `${API_BASE_URL}/crypto/price/${symbol}`;
                        const response = await axios.get(endpoint);
                        const price = response.data?.data?.price ??
                            response.data?.price ??
                            response.data?.data?.regularMarketPrice ??
                            null;
                        return { symbol, price: price ? Number(price) : null };
                    })
                );

                const prices = { ...lastKnownPricesRef.current }; // Start with last known good prices

                for (const result of results) {
                    if (result.status === 'fulfilled' && result.value.price !== null) {
                        const { symbol, price } = result.value;
                        prices[symbol] = price;
                        lastKnownPricesRef.current[symbol] = price; // Persist for future fallback
                    }
                    // If fetch failed, we keep the last known price from the spread above
                }

                setLivePrices(prices);
            } catch (e) {
                console.error('Failed to fetch live prices:', e);
                // On total failure, use last known prices so P/L doesn't show false 0%
                if (Object.keys(lastKnownPricesRef.current).length > 0) {
                    setLivePrices({ ...lastKnownPricesRef.current });
                }
            }
        };

        // Fetch immediately and then every 5 seconds for near real-time P/L
        fetchPrices();
        const interval = setInterval(fetchPrices, 5000);
        return () => clearInterval(interval);
    }, [portfolioHoldings]);

    /**
     * Execute a buy transaction
    * @param {string} symbol - Asset symbol (BTC, ETH, etc.)
     * @param {number} quantity - Quantity to buy
     * @param {number} buyPrice - Price per unit at time of purchase
    * @param {string} type - 'crypto'
     * @returns {boolean} - Success/failure
     */
    const buyAsset = useCallback((symbol, quantity, buyPrice, type = 'crypto') => {
        const totalCost = quantity * buyPrice;

        // Check sufficient balance
        if (totalCost > walletBalance) {
            console.error(`Insufficient balance. Need $${totalCost}, have $${walletBalance}`);
            return false;
        }

        // Deduct from wallet
        setWalletBalance(prev => prev - totalCost);

        // Add to portfolio or update existing holding
        setPortfolioHoldings(prev => {
            const existingIndex = prev.findIndex(h => h.symbol === symbol && h.type === 'crypto');

            if (existingIndex >= 0) {
                // Update existing holding with new average price
                const existing = prev[existingIndex];
                const totalQuantity = existing.quantity + quantity;
                const totalCostBasis = (existing.quantity * existing.buyPrice) + totalCost;
                const newAvgPrice = totalCostBasis / totalQuantity;

                const updated = [...prev];
                updated[existingIndex] = {
                    ...existing,
                    quantity: totalQuantity,
                    buyPrice: newAvgPrice,
                    trades: [
                        ...(existing.trades || []),
                        {
                            date: new Date().toISOString(),
                            type: 'buy',
                            quantity,
                            price: buyPrice,
                            total: totalCost
                        }
                    ]
                };
                return updated;
            } else {
                // Add new holding
                return [
                    ...prev,
                    {
                        symbol,
                        type: 'crypto',
                        quantity,
                        buyPrice,
                        trades: [
                            {
                                date: new Date().toISOString(),
                                type: 'buy',
                                quantity,
                                price: buyPrice,
                                total: totalCost
                            }
                        ]
                    }
                ];
            }
        });

        return true;
    }, [walletBalance]);

    /**
     * Execute a sell transaction
     * @param {string} symbol - Asset symbol (BTC, ETH, etc.)
     * @param {number} quantity - Quantity to sell
     * @param {number} sellPrice - Price per unit at time of sale
     * @param {string} type - 'crypto'
     * @returns {boolean} - Success/failure
     */
    const sellAsset = useCallback((symbol, quantity, sellPrice, type = 'crypto') => {
        if (!quantity || quantity <= 0) {
            return false;
        }

        let holdingExists = false;
        let saleProceeds = quantity * sellPrice;

        setPortfolioHoldings((prev) => {
            const holdingIndex = prev.findIndex((holding) => holding.symbol === symbol && holding.type === type);
            if (holdingIndex < 0) {
                return prev;
            }

            holdingExists = true;
            const holding = prev[holdingIndex];
            if (quantity > holding.quantity) {
                holdingExists = false;
                return prev;
            }

            const updatedQuantity = holding.quantity - quantity;
            const updated = [...prev];

            if (updatedQuantity <= 0) {
                updated.splice(holdingIndex, 1);
            } else {
                updated[holdingIndex] = {
                    ...holding,
                    quantity: updatedQuantity,
                    trades: [
                        ...(holding.trades || []),
                        {
                            date: new Date().toISOString(),
                            type: 'sell',
                            quantity,
                            price: sellPrice,
                            total: saleProceeds,
                        },
                    ],
                };
            }

            return updated;
        });

        if (!holdingExists) {
            return false;
        }

        setWalletBalance((prev) => prev + saleProceeds);
        return true;
    }, []);

    /**
     * Calculate current portfolio value based on live prices
     */
    const calculatePortfolioValue = useCallback(() => {
        return portfolioHoldings.reduce((total, holding) => {
            const currentPrice = livePrices[holding.symbol] || holding.buyPrice;
            return total + (holding.quantity * currentPrice);
        }, 0);
    }, [portfolioHoldings, livePrices]);

    /**
     * Calculate total P&L for portfolio
     */
    const calculateTotalPnL = useCallback(() => {
        return portfolioHoldings.reduce((total, holding) => {
            const currentPrice = livePrices[holding.symbol] || holding.buyPrice;
            const currentValue = holding.quantity * currentPrice;
            const costBasis = holding.quantity * holding.buyPrice;
            return total + (currentValue - costBasis);
        }, 0);
    }, [portfolioHoldings, livePrices]);

    /**
     * Calculate per-asset P&L
     */
    const calculateAssetPnL = useCallback((symbol, type) => {
        const holding = portfolioHoldings.find(h => h.symbol === symbol && h.type === type);
        if (!holding) return 0;

        const currentPrice = livePrices[symbol] || holding.buyPrice;
        const currentValue = holding.quantity * currentPrice;
        const costBasis = holding.quantity * holding.buyPrice;
        return currentValue - costBasis;
    }, [portfolioHoldings, livePrices]);

    /**
     * Get all holdings with calculated values
     */
    const getHoldingsWithValues = useCallback(() => {
        return portfolioHoldings.map(holding => {
            const currentPrice = livePrices[holding.symbol] || holding.buyPrice;
            const currentValue = holding.quantity * currentPrice;
            const costBasis = holding.quantity * holding.buyPrice;
            const pnl = currentValue - costBasis;
            const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

            return {
                ...holding,
                currentPrice,
                currentValue,
                costBasis,
                pnl,
                pnlPercent
            };
        });
    }, [portfolioHoldings, livePrices]);

    /**
     * Get the most recent trades for a symbol across the current portfolio
     */
    const getRecentTradesForSymbol = useCallback((symbol, limit = 4) => {
        const matches = portfolioHoldings
            .filter((holding) => holding.symbol === symbol)
            .flatMap((holding) => (holding.trades || []).map((trade) => ({
                ...trade,
                symbol: holding.symbol,
                type: trade.type || 'buy',
            })));

        return matches
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }, [portfolioHoldings]);

    return {
        walletBalance,
        setWalletBalance,
        portfolioHoldings,
        livePrices,
        buyAsset,
        sellAsset,
        calculatePortfolioValue,
        calculateTotalPnL,
        calculateAssetPnL,
        getHoldingsWithValues,
        getRecentTradesForSymbol,
    };
};

export default useWalletAndPortfolio;
