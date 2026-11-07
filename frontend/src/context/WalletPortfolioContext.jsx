/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import apiClient from '../lib/apiClient';
import { useAuth } from './AuthContext';
import { buildUserScopedStorageKey } from '../utils/storage';

const INITIAL_BALANCE = 100000;
const PRICE_POLL_INTERVAL = 4000;
const WALLET_KEY = 'wallet_balance';
const PORTFOLIO_KEY = 'portfolio_holdings';
const UPDATED_AT_KEY = 'wallet_portfolio_updated_at';
const context = createContext(null);

const readLocalState = (userId) => {
    const walletKey = buildUserScopedStorageKey(WALLET_KEY, userId);
    const portfolioKey = buildUserScopedStorageKey(PORTFOLIO_KEY, userId);
    try {
        const wallet = Number(localStorage.getItem(walletKey));
        const parsed = JSON.parse(localStorage.getItem(portfolioKey) || '[]');
        const updatedAt = Number(localStorage.getItem(buildUserScopedStorageKey(UPDATED_AT_KEY, userId))) || 0;
        return {
            walletBalance: Number.isFinite(wallet) ? wallet : INITIAL_BALANCE,
            portfolioHoldings: Array.isArray(parsed) ? parsed : [],
            updatedAt,
        };
    } catch (error) {
        console.error('Failed to read local trading state:', error);
        return { walletBalance: INITIAL_BALANCE, portfolioHoldings: [], updatedAt: 0 };
    }
};

const saveLocalState = (userId, walletBalance, portfolioHoldings, updatedAt = Date.now()) => {
    try {
        localStorage.setItem(buildUserScopedStorageKey(WALLET_KEY, userId), String(walletBalance));
        localStorage.setItem(buildUserScopedStorageKey(PORTFOLIO_KEY, userId), JSON.stringify(portfolioHoldings));
        localStorage.setItem(buildUserScopedStorageKey(UPDATED_AT_KEY, userId), String(updatedAt));
    } catch (error) {
        console.error('Failed to save local trading state:', error);
    }
};

const normalizeDisplaySymbol = (value) => {
    const normalized = String(value || '').toUpperCase().replace(/USDT$/, '');
    return {
        BITCOIN: 'BTC', BTC: 'BTC', ETHEREUM: 'ETH', ETH: 'ETH',
        SOLANA: 'SOL', SOL: 'SOL', DOGECOIN: 'DOGE', DOGE: 'DOGE',
        SHIBA: 'SHIB', SHIB: 'SHIB',
    }[normalized] || normalized;
};

const makeIdempotencyKey = () => (
    typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
);

const toHolding = (holding) => ({
    ...holding,
    type: holding.type || 'crypto',
    quantity: Number(holding.quantity),
    buyPrice: Number(holding.buyPrice),
});

const pricePoller = { subscribers: new Map(), timer: null, controller: null, inFlight: false, failureDelay: PRICE_POLL_INTERVAL };
const schedulePricePoll = (delay) => {
    if (pricePoller.timer) clearTimeout(pricePoller.timer);
    if (!pricePoller.subscribers.size || (typeof document !== 'undefined' && document.hidden)) {
        pricePoller.timer = null;
        return;
    }
    pricePoller.timer = setTimeout(runPricePoll, delay);
};
const runPricePoll = async () => {
    if (pricePoller.inFlight || !pricePoller.subscribers.size) return;
    const symbols = [...new Set([...pricePoller.subscribers.values()].flatMap((subscriber) => subscriber.symbols))];
    if (!symbols.length) return;
    pricePoller.inFlight = true;
    pricePoller.controller = new AbortController();
    try {
        const response = await apiClient.get('/crypto/batch', {
            params: { symbols: symbols.join(',') },
            signal: pricePoller.controller.signal,
        });
        const prices = {};
        (Array.isArray(response.data?.data) ? response.data.data : []).forEach((result) => {
            const resultSymbol = result?.baseAsset || String(result?.symbol || '').replace(/USDT$/i, '');
            const price = Number(result?.data?.price ?? result?.price);
            if (resultSymbol && Number.isFinite(price) && price > 0) {
                prices[normalizeDisplaySymbol(resultSymbol)] = price;
            }
        });
        pricePoller.failureDelay = PRICE_POLL_INTERVAL;
        for (const subscriber of pricePoller.subscribers.values()) subscriber.onSuccess(prices);
    } catch (error) {
        if (error?.code !== 'ERR_CANCELED') {
            console.warn('Failed to fetch live prices:', error?.message || error);
            pricePoller.failureDelay = Math.min(pricePoller.failureDelay * 2, 60000);
            for (const subscriber of pricePoller.subscribers.values()) subscriber.onFailure();
        }
    } finally {
        pricePoller.inFlight = false;
        pricePoller.controller = null;
        schedulePricePoll(pricePoller.failureDelay);
    }
};
const subscribeToPricePoller = (symbols, onSuccess, onFailure) => {
    const id = Symbol('price-poller-subscriber');
    pricePoller.subscribers.set(id, { symbols, onSuccess, onFailure });
    if (!pricePoller.timer && !pricePoller.inFlight) runPricePoll();
    return () => {
        pricePoller.subscribers.delete(id);
        if (!pricePoller.subscribers.size) {
            if (pricePoller.timer) clearTimeout(pricePoller.timer);
            pricePoller.timer = null;
            pricePoller.controller?.abort();
            pricePoller.failureDelay = PRICE_POLL_INTERVAL;
        }
    };
};

export const WalletPortfolioProvider = ({ children }) => {
    const { user, getToken } = useAuth();
    const initial = useMemo(() => readLocalState(user?.id), [user?.id]);
    const [walletBalance, setWalletBalance] = useState(initial.walletBalance);
    const [portfolioHoldings, setPortfolioHoldings] = useState(initial.portfolioHoldings.map(toHolding));
    const [tradeHistory, setTradeHistory] = useState([]);
    const [livePrices, setLivePrices] = useState({});
    const [pricesUpdatedAt, setPricesUpdatedAt] = useState(0);
    const [isHydrating, setIsHydrating] = useState(true);
    const [stateError, setStateError] = useState('');
    const localUpdatedAtRef = useRef(initial.updatedAt);
    const lastKnownPricesRef = useRef({});

    const getAuthHeaders = useCallback(async () => {
        const token = await getToken?.();
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, [getToken]);

    const applyState = useCallback((state, updatedAt) => {
        const nextHoldings = Array.isArray(state.portfolioHoldings) ? state.portfolioHoldings.map(toHolding) : [];
        setWalletBalance(Number.isFinite(Number(state.walletBalance)) ? Number(state.walletBalance) : INITIAL_BALANCE);
        setPortfolioHoldings(nextHoldings);
        localUpdatedAtRef.current = updatedAt;
        if (user?.id) saveLocalState(user.id, Number(state.walletBalance), nextHoldings, updatedAt);
    }, [user]);

    const refreshState = useCallback(async () => {
        const headers = await getAuthHeaders();
        if (!headers.Authorization) return;
        const [stateResponse, historyResponse] = await Promise.all([
            apiClient.get('/trading/state', { headers }),
            apiClient.get('/trading/history', { headers }),
        ]);
        const state = stateResponse.data?.data || {};
        const remoteUpdatedAt = Date.parse(state.updatedAt || state.lastSyncedAt || '') || 0;
        if (remoteUpdatedAt >= localUpdatedAtRef.current) {
            applyState(state, remoteUpdatedAt || Date.now());
        }
        setTradeHistory(Array.isArray(historyResponse.data?.data) ? historyResponse.data.data : []);
        setStateError('');
    }, [applyState, getAuthHeaders]);

    useEffect(() => {
        if (!user?.id) {
            setIsHydrating(false);
            return undefined;
        }
        const local = readLocalState(user.id);
        localUpdatedAtRef.current = local.updatedAt;
        setWalletBalance(local.walletBalance);
        setPortfolioHoldings(local.portfolioHoldings.map(toHolding));
        setIsHydrating(true);
        let cancelled = false;
        refreshState().catch((error) => {
            if (!cancelled) {
                setStateError(error?.response?.data?.error?.message || error?.response?.data?.error || 'Unable to load trading account');
                console.error('Failed to load trading account:', error);
            }
        }).finally(() => {
            if (!cancelled) setIsHydrating(false);
        });
        return () => { cancelled = true; };
    }, [user?.id, refreshState]);

    const submitTrade = useCallback(async (symbol, quantity, price, type) => {
        try {
            const headers = await getAuthHeaders();
            if (!headers.Authorization) return { success: false, error: 'Please sign in to trade.' };
            const response = await apiClient.post('/trading/orders', { symbol, quantity, price, type, assetType: 'crypto' }, {
                headers: { ...headers, 'Idempotency-Key': makeIdempotencyKey() },
            });
            await refreshState();
            return { success: true, data: response.data?.data };
        } catch (error) {
            const message = error?.response?.data?.error?.message || error?.response?.data?.error || 'Trade failed. Please try again.';
            setStateError(message);
            return { success: false, error: message };
        }
    }, [getAuthHeaders, refreshState]);

    const portfolioSymbolsKey = [...new Set(portfolioHoldings.map((holding) => normalizeDisplaySymbol(holding.symbol)).filter(Boolean))].join(',');
    useEffect(() => {
        if (!portfolioSymbolsKey) return undefined;
        return subscribeToPricePoller(
            portfolioSymbolsKey.split(','),
            (prices) => {
                Object.assign(lastKnownPricesRef.current, prices);
                setLivePrices({ ...lastKnownPricesRef.current });
                setPricesUpdatedAt(Date.now());
            },
            () => setLivePrices({ ...lastKnownPricesRef.current }),
        );
    }, [portfolioSymbolsKey]);

    const pricesReady = portfolioHoldings.length === 0 || portfolioHoldings.every((holding) => (
        Number.isFinite(livePrices[normalizeDisplaySymbol(holding.symbol)])
    ));
    const getCurrentPrice = useCallback((holding) => livePrices[normalizeDisplaySymbol(holding.symbol)], [livePrices]);
    const getHoldingsWithValues = useCallback(() => portfolioHoldings.map((holding) => {
        const currentPrice = getCurrentPrice(holding);
        const currentValue = Number.isFinite(currentPrice) ? holding.quantity * currentPrice : 0;
        const costBasis = holding.quantity * holding.buyPrice;
        const pnl = Number.isFinite(currentPrice) ? currentValue - costBasis : 0;
        return { ...holding, currentPrice, currentValue, costBasis, pnl, pnlPercent: costBasis > 0 ? (pnl / costBasis) * 100 : 0 };
    }), [getCurrentPrice, portfolioHoldings]);
    const calculatePortfolioValue = useCallback(() => getHoldingsWithValues().reduce((total, holding) => total + holding.currentValue, 0), [getHoldingsWithValues]);
    const calculateTotalPnL = useCallback(() => getHoldingsWithValues().reduce((total, holding) => total + holding.pnl, 0), [getHoldingsWithValues]);
    const calculateAssetPnL = useCallback((symbol, type) => getHoldingsWithValues().find((holding) => holding.symbol === symbol && holding.type === type)?.pnl || 0, [getHoldingsWithValues]);
    const getRecentTradesForSymbol = useCallback((symbol, limit = 4) => tradeHistory
        .filter((trade) => normalizeDisplaySymbol(trade.symbol) === normalizeDisplaySymbol(symbol))
        .slice(0, limit)
        .map((trade) => ({ ...trade, type: trade.type.toLowerCase() })), [tradeHistory]);
    const value = {
        walletBalance, portfolioHoldings, livePrices, pricesUpdatedAt, pricesReady, isHydrating, stateError,
        refreshState, buyAsset: (symbol, quantity, price) => submitTrade(symbol, quantity, price, 'BUY'),
        sellAsset: (symbol, quantity, price) => submitTrade(symbol, quantity, price, 'SELL'),
        calculatePortfolioValue, calculateTotalPnL, calculateAssetPnL, getHoldingsWithValues, getRecentTradesForSymbol,
    };
    return <context.Provider value={value}>{children}</context.Provider>;
};

export const useWalletAndPortfolio = () => {
    const value = useContext(context);
    if (!value) throw new Error('useWalletAndPortfolio must be used within WalletPortfolioProvider');
    return value;
};

export default useWalletAndPortfolio;
