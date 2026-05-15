import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { ArrowLeft, Activity, Maximize2, Columns, Grid2X2, Trash2, ShoppingCart, Search, X, ChevronDown, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import CandlestickChart from '../components/ui/CandlestickChart';
import TradeIntelPanel from '../components/ui/TradeIntelPanel';
import useWalletAndPortfolio from '../hooks/useWalletAndPortfolio';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { buildUserScopedStorageKey } from '../utils/storage';
import { formatPrice } from '../utils/formatPrice';
import { useCurrency } from '../context/CurrencyContext';
import { formatAmount } from '../utils/formatCurrency';
import CoinIcon from '../components/ui/CoinIcon';

const API_URL = API_BASE_URL; // Alias for local usage in this file

const TIMEFRAMES = [
    { label: '1 Min', value: '1MIN', interval: '1m', limit: 60, startOffset: 60 * 60 * 1000 },
    { label: '5 Min', value: '5MIN', interval: '5m', limit: 72, startOffset: 6 * 60 * 60 * 1000 },
    { label: '15 Min', value: '15MIN', interval: '15m', limit: 96, startOffset: 24 * 60 * 60 * 1000 },
    { label: '30 Min', value: '30MIN', interval: '30m', limit: 96, startOffset: 2 * 24 * 60 * 60 * 1000 },
    { label: '45 Min', value: '45MIN', interval: '45m', limit: 96, startOffset: 3 * 24 * 60 * 60 * 1000 },
    { label: '1 Day', value: '1D', interval: '1h', limit: 24, startOffset: 24 * 60 * 60 * 1000 },
    { label: '1 Week', value: '1W', interval: '4h', limit: 42, startOffset: 7 * 24 * 60 * 60 * 1000 },
    { label: '1 Month', value: '1M', interval: '1d', limit: 30, startOffset: 30 * 24 * 60 * 60 * 1000 },
    { label: '1 Year', value: '1Y', interval: '1w', limit: 52, startOffset: 365 * 24 * 60 * 60 * 1000 },
];

// Seeded random for deterministic data generation
function seededRandom(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

// Hash function to convert string to number seed
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash);
}

const assetBaseProfiles = {
    bitcoin: { base: 65000, volatility: 1800 },
    ethereum: { base: 3200, volatility: 160 },
    solana: { base: 160, volatility: 14 },
    dogecoin: { base: 0.18, volatility: 0.03 },
    shiba: { base: 0.000028, volatility: 0.000006 },
    shib: { base: 0.000028, volatility: 0.000006 }
};

const getAssetProfile = (assetId) => {
    const normalized = assetId.toLowerCase().replace(/[^a-z0-9]/g, '');

    for (const key of Object.keys(assetBaseProfiles)) {
        if (normalized.includes(key)) {
            return assetBaseProfiles[key];
        }
    }

    const hash = hashCode(normalized);
    const isCrypto = normalized.endsWith('usdt') || ['bitcoin', 'ethereum', 'solana', 'dogecoin', 'shiba', 'shib'].some((key) => normalized.includes(key));

    if (isCrypto) {
        return {
            base: Number(((hash % 500000) / 100000 + 0.001).toFixed(6)),
            volatility: Number((((hash % 12000) / 1000000) + 0.0005).toFixed(6))
        };
    }

    return {
        base: Number((40 + (hash % 600)).toFixed(2)),
        volatility: Number((4 + (hash % 25)).toFixed(2))
    };
};

// Helper to get display name for assets
const getAssetDisplayName = (assetId) => {
    const assetMap = {
        'bitcoin': 'BTC',
        'ethereum': 'ETH',
        'solana': 'SOL',
        'dogecoin': 'DOGE',
        'shiba': 'SHIB',
        'shib': 'SHIB'
    };
    return assetMap[assetId] || assetId.toUpperCase();
};

const isCryptoAsset = (assetId = '') => {
    const normalized = assetId.toLowerCase();
    return ['bitcoin', 'ethereum', 'solana', 'dogecoin', 'shiba', 'shib'].some((key) => normalized.includes(key)) || normalized.endsWith('usdt');
};

const normalizeAssetSymbol = (assetId = '') => {
    const normalized = assetId.trim().toUpperCase();
    return normalized.endsWith('USDT') ? normalized : normalized;
};

const normalizeAssetType = (value = '') => {
    const normalized = String(value).toLowerCase();
    if (normalized === 'crypto') return 'crypto';
    return '';
};

const inferAssetType = (assetId = '') => {
    return isCryptoAsset(assetId) ? 'crypto' : 'crypto';
};

const getBinanceSymbol = (assetId = '') => {
    const normalized = assetId.trim().toUpperCase();
    if (!normalized) return 'BTCUSDT';

    const symbolMap = {
        BITCOIN: 'BTCUSDT',
        BTC: 'BTCUSDT',
        ETHEREUM: 'ETHUSDT',
        ETH: 'ETHUSDT',
        SOLANA: 'SOLUSDT',
        SOL: 'SOLUSDT',
        DOGECOIN: 'DOGEUSDT',
        DOGE: 'DOGEUSDT',
        SHIBA: 'SHIBUSDT',
        SHIB: 'SHIBUSDT',
    };

    if (symbolMap[normalized]) return symbolMap[normalized];
    if (normalized.endsWith('USDT')) return normalized;
    return `${normalized}USDT`;
};

const buildHistoryRequest = (assetId, timeframe) => {
    return {
        endpoint: `${API_URL}/crypto/history/${normalizeAssetSymbol(assetId)}`,
        params: {
            interval: {
                '1H': '1h',
                '1D': '1d',
                '1W': '1w',
                '1M': '1M',
                '1Y': '1M'
            }[timeframe] || '1d',
            limit: {
                '1H': 24,
                '1D': 30,
                '1W': 52,
                '1M': 30,
                '1Y': 12
            }[timeframe] || 30
        },
        isCrypto: true
    };
};

// Asset Search Modal Component
const AssetSearchModal = ({ isOpen, onClose, onSelect, currentAsset }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        const fetchAssets = async () => {
            setLoading(true);
            try {
                const cryptoRes = await axios.get(`${API_URL}/crypto/market-cap?limit=50`);

                const cryptoAssets = (cryptoRes.data.data || []).map(c => ({
                    symbol: c.baseAsset || c.symbol.replace('USDT', ''),
                    name: c.baseAsset || c.symbol,
                    type: 'crypto',
                    price: c.price
                }));

                setAssets(cryptoAssets);
            } catch (error) {
                console.error('Failed to fetch assets:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAssets();
    }, [isOpen]);

    const filteredAssets = assets.filter(a =>
        a.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">Search Assets</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Search Input */}
                <div className="p-6 border-b border-white/10">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search by symbol or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-accent"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Asset List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                        </div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            No assets found
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredAssets.map(asset => (
                                <button
                                    key={asset.symbol}
                                    onClick={() => onSelect(asset)}
                                    className={`w-full flex items-center justify-between p-4 rounded-lg transition-all ${asset.symbol === currentAsset
                                        ? 'bg-accent/20 border-2 border-accent'
                                        : 'bg-slate-900/30 border border-white/5 hover:bg-slate-800/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <CoinIcon symbol={asset.symbol} size={32} />
                                        <div className="text-left">
                                            <div className="font-bold text-white">{asset.symbol}</div>
                                            <div className="text-xs text-slate-500">{asset.name}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-white">{formatPrice(asset.price)}</div>
                                        <div className="text-xs text-slate-500 capitalize">{asset.type}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ChartInstance = ({ config, onUpdate, isSingle, useSharedFeed = false, sharedCandles = [] }) => {
    const [showSearch, setShowSearch] = useState(false);
    const [showTimeframeMenu, setShowTimeframeMenu] = useState(false);
    const selectedTimeframe = TIMEFRAMES.find((item) => item.value === config.timeframe) || TIMEFRAMES[0];

    const toggleIndicator = (key) => {
        onUpdate({
            ...config,
            indicators: { ...config.indicators, [key]: !config.indicators[key] }
        });
    };

    return (
        <div className={`relative bg-secondary/30 rounded-2xl border border-slate-700/50 flex overflow-hidden ${isSingle ? 'h-[600px]' : 'h-full'}`}>
            <div className="flex-1 flex flex-col p-4">
                {/* Chart Header */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="font-bold text-xl text-white">
                                {getAssetDisplayName(config.assetId)}
                            </div>
                            <button
                                onClick={() => setShowSearch(true)}
                                className="p-1.5 bg-slate-800/50 rounded-lg hover:bg-slate-700 transition-colors border border-white/10"
                                title="Search Assets"
                            >
                                <Search size={16} className="text-slate-400" />
                            </button>
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setShowTimeframeMenu((prev) => !prev)}
                                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-xs font-bold text-white transition-colors hover:border-sky-400/40"
                            >
                                <span>{selectedTimeframe.label}</span>
                                <ChevronDown size={14} className="text-sky-300" />
                            </button>
                            {showTimeframeMenu && (
                                <div className="absolute left-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0A0A0A] shadow-2xl shadow-black/40">
                                    {TIMEFRAMES.map((item) => {
                                        const active = config.timeframe === item.value;
                                        return (
                                            <button
                                                key={item.value}
                                                onClick={() => {
                                                    onUpdate({ ...config, timeframe: item.value });
                                                    setShowTimeframeMenu(false);
                                                }}
                                                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${active ? 'bg-sky-400/15 text-sky-300' : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'}`}
                                            >
                                                <span>{item.label}</span>
                                                {active && <Check size={14} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="relative group/ind">
                            <button className="p-1.5 bg-slate-800 rounded-lg text-slate-300 hover:text-white border border-white/5">
                                <Activity size={14} />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-32 bg-[#0A0A0A] border border-white/10 rounded-xl p-2 z-10 hidden group-hover/ind:block shadow-xl">
                                {['sma', 'ema'].map(ind => (
                                    <button
                                        key={ind}
                                        onClick={() => toggleIndicator(ind)}
                                        className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg hover:bg-white/5 ${config.indicators[ind] ? 'text-accent' : 'text-slate-500'}`}
                                    >
                                        {ind.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart Body - Live candlestick chart */}
                <div className="flex-1 min-h-0 relative">
                    <CandlestickChart
                        symbol={config.assetId}
                        type={config.assetType}
                        timeframe={config.timeframe}
                        height={isSingle ? 540 : 300}
                        indicators={config.indicators}
                        showVolume={true}
                        externalCandles={useSharedFeed ? sharedCandles : null}
                        disableInternalRealtime={useSharedFeed}
                    />
                </div>
            </div>

            {/* Asset Search Modal */}
            <AssetSearchModal
                isOpen={showSearch}
                onClose={() => setShowSearch(false)}
                onSelect={(asset) => {
                    onUpdate({
                        ...config,
                        assetId: asset.symbol,
                        assetType: normalizeAssetType(asset.type) || inferAssetType(asset.symbol),
                    });
                    setShowSearch(false);
                }}
                currentAsset={config.assetId}
            />
        </div>
    );
};

export default function Trade() {
    const { assetId } = useParams();
    const { user } = useAuth();
    const { currency, convert } = useCurrency();
    const { buyAsset, sellAsset, walletBalance, getRecentTradesForSymbol } = useWalletAndPortfolio();
    const [layout, setLayout] = useState('single'); // single, split-h, split-v, quad
    const [quantity, setQuantity] = useState('');
    const [livePrice, setLivePrice] = useState(null);
    const [orderBookData, setOrderBookData] = useState({ asks: [], bids: [] });
    const [recentTrades, setRecentTrades] = useState([]);
    const [sharedCandles, setSharedCandles] = useState([]);
    const [buyError, setBuyError] = useState('');
    const [assetSnapshot, setAssetSnapshot] = useState({ price: null, high: null, low: null, volume: null, marketCap: null, changePercent: 0 });
    const wsRef = useRef(null);
    const initialAssetType = 'crypto';

    // Default config template
    const createConfig = (id, asset = assetId || 'bitcoin') => ({
        id,
        assetId: asset,
        assetType: initialAssetType,
        timeframe: '1D',
        chartType: 'candlestick', // 'candlestick' or 'line'
        indicators: { sma: false, ema: false }
    });

    const chartLayoutStorageKey = buildUserScopedStorageKey('tradesim_chart_layout', user?.id);

    const [configs, setConfigs] = useState(() => {
        const saved = localStorage.getItem(chartLayoutStorageKey);
        if (saved) {
            return JSON.parse(saved).map((config) => ({
                ...config,
                assetType: normalizeAssetType(config.assetType) || initialAssetType,
            }));
        }
        return [createConfig(1)];
    });

    useEffect(() => {
        const saved = localStorage.getItem(chartLayoutStorageKey);

        if (saved) {
            setConfigs(JSON.parse(saved).map((config) => ({
                ...config,
                assetType: normalizeAssetType(config.assetType) || initialAssetType,
            })));
            return;
        }

        setConfigs([createConfig(1)]);
    }, [chartLayoutStorageKey]);

    // Sync URL param to configs
    useEffect(() => {
        if (assetId && configs[0].assetId !== assetId) {
            updateConfig({
                ...configs[0],
                assetId,
                assetType: 'crypto',
            });
        }
    }, [assetId]);

    // Sync to localStorage
    useEffect(() => {
        localStorage.setItem(chartLayoutStorageKey, JSON.stringify(configs));
    }, [configs, chartLayoutStorageKey]);

    const primaryConfig = configs[0] || createConfig(1);
    const primarySymbol = primaryConfig.assetId;
    const primaryAssetType = normalizeAssetType(primaryConfig.assetType) || 'crypto';
    const currentPrice = Number(livePrice) || 0;

    useEffect(() => {
        setLivePrice(null);
        setOrderBookData({ asks: [], bids: [] });
        setRecentTrades([]);
        setSharedCandles([]);
    }, [primarySymbol]);

    useEffect(() => {
        let cancelled = false;

        const loadAssetSnapshot = async () => {
            if (!primarySymbol) return;

            try {
                const [quoteResponse, marketResponse] = await Promise.all([
                    axios.get(`${API_URL}/crypto/price/${primarySymbol}`),
                    axios.get(`${API_URL}/crypto/market-cap?limit=100`),
                ]);

                if (cancelled) return;

                const quote = quoteResponse.data?.data || {};
                const marketList = Array.isArray(marketResponse.data?.data)
                    ? marketResponse.data.data
                    : Array.isArray(marketResponse.data)
                        ? marketResponse.data
                        : [];

                const marketEntry = marketList.find((item) => {
                    const symbolMatch = String(item.symbol || '').replace('USDT', '').toUpperCase();
                    return symbolMatch === primarySymbol.toUpperCase() || String(item.baseAsset || '').toUpperCase() === primarySymbol.toUpperCase();
                }) || {};

                setAssetSnapshot({
                    price: Number(quote.price ?? livePrice ?? currentPrice ?? 0),
                    high: Number(quote.high ?? marketEntry.high ?? quote.price ?? 0),
                    low: Number(quote.low ?? marketEntry.low ?? quote.price ?? 0),
                    volume: Number(quote.volume ?? marketEntry.volume ?? marketEntry.quoteVolume ?? 0),
                    marketCap: Number(marketEntry.marketCap ?? marketEntry.quoteVolume ?? marketEntry.volume ?? 0),
                    changePercent: Number(quote.changePercent ?? marketEntry.changePercent ?? 0),
                });
            } catch (error) {
                console.error('Failed to load asset snapshot:', error);
                if (!cancelled) {
                    setAssetSnapshot((previous) => ({
                        ...previous,
                        price: Number(livePrice || currentPrice || 0),
                    }));
                }
            }
        };

        loadAssetSnapshot();

        return () => {
            cancelled = true;
        };
    }, [primarySymbol, livePrice]);

    useEffect(() => {
        if (primaryAssetType !== 'crypto') {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            return undefined;
        }

        let isCancelled = false;
        const binanceSymbol = getBinanceSymbol(primarySymbol);

        const closeSocket = () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };

        const loadHistory = async () => {
            const response = await fetch(
                `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=1m&limit=200`
            );

            if (!response.ok) {
                throw new Error(`Failed to load Binance history: ${response.status}`);
            }

            const payload = await response.json();
            if (!Array.isArray(payload)) return [];

            return payload.map((kline) => ({
                time: Math.floor(Number(kline[0]) / 1000),
                open: Number.parseFloat(kline[1]),
                high: Number.parseFloat(kline[2]),
                low: Number.parseFloat(kline[3]),
                close: Number.parseFloat(kline[4]),
                volume: Number.parseFloat(kline[5] || 0),
            }));
        };

        const openWebSocket = () => {
            closeSocket();
            const streamSymbol = binanceSymbol.toLowerCase();
            const streams = `${streamSymbol}@kline_1m/${streamSymbol}@depth20@100ms/${streamSymbol}@trade`;
            const socket = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

            socket.onmessage = (event) => {
                if (isCancelled) return;

                try {
                    const message = JSON.parse(event.data);
                    const streamName = message?.stream || '';
                    const data = message?.data;
                    if (!data) return;

                    if (streamName.includes('@kline')) {
                        const kline = data.k;
                        if (!kline) return;

                        const candle = {
                            time: Math.floor(Number(kline.t) / 1000),
                            open: Number.parseFloat(kline.o),
                            high: Number.parseFloat(kline.h),
                            low: Number.parseFloat(kline.l),
                            close: Number.parseFloat(kline.c),
                            volume: Number.parseFloat(kline.v),
                        };

                        setLivePrice(candle.close);
                        setSharedCandles((previous) => {
                            if (!previous.length) return [candle];
                            const next = [...previous];
                            const last = next[next.length - 1];

                            if (last.time === candle.time) {
                                next[next.length - 1] = candle;
                            } else if (candle.time > last.time) {
                                next.push(candle);
                            }

                            return next.slice(-250);
                        });
                    }

                    if (streamName.includes('@depth')) {
                        const asks = Array.isArray(data.asks)
                            ? data.asks.slice(0, 10).map(([price, size]) => ({
                                price: Number.parseFloat(price),
                                size: Number.parseFloat(size),
                            }))
                            : [];
                        const bids = Array.isArray(data.bids)
                            ? data.bids.slice(0, 10).map(([price, size]) => ({
                                price: Number.parseFloat(price),
                                size: Number.parseFloat(size),
                            }))
                            : [];

                        setOrderBookData({ asks, bids });
                    }

                    if (streamName.includes('@trade')) {
                        setRecentTrades((previous) => ([{
                            price: Number.parseFloat(data.p),
                            size: Number.parseFloat(data.q),
                            time: new Date(data.T).toLocaleTimeString(),
                            isBuy: data.m === false,
                        }, ...previous].slice(0, 20)));
                    }
                } catch (socketError) {
                    console.error('Failed to process Binance stream message:', socketError);
                }
            };

            socket.onerror = (socketError) => {
                console.error('Binance stream connection error:', socketError);
            };

            wsRef.current = socket;
        };

        const initializeFeed = async () => {
            try {
                const history = await loadHistory();
                if (isCancelled) return;

                setSharedCandles(history);
                if (history.length > 0) {
                    setLivePrice(history[history.length - 1].close);
                }
            } catch (historyError) {
                console.error('Failed to initialize Binance history:', historyError);
            }

            if (!isCancelled) {
                openWebSocket();
            }
        };

        initializeFeed();

        return () => {
            isCancelled = true;
            closeSocket();
        };
    }, [primarySymbol, primaryAssetType]);

    const handleLayoutChange = (newLayout) => {
        setLayout(newLayout);
        const count = newLayout === 'single' ? 1 : newLayout === 'quad' ? 4 : 2;

        setConfigs(prev => {
            if (prev.length === count) return prev;
            if (prev.length > count) return prev.slice(0, count);
            const extra = Array.from({ length: count - prev.length }, (_, i) =>
                createConfig(prev.length + i + 1)
            );
            return [...prev, ...extra];
        });
    };

    const updateConfig = (updated) => {
        setConfigs(prev => prev.map(c => c.id === updated.id ? updated : c));
    };

    const handleBuyNow = () => {
        setBuyError('');
        const qty = parseFloat(quantity);
        if (!qty || qty <= 0) {
            setBuyError('Please enter a valid quantity');
            return;
        }

        const currentAsset = configs[0].assetId;
        const totalCost = currentPrice * qty;

        // Check if user has sufficient balance
        if (totalCost > walletBalance) {
            setBuyError(`Insufficient balance. Need ${formatAmount(convert(totalCost), currency)}, have ${formatAmount(convert(walletBalance), currency)}`);
            return;
        }

        const success = buyAsset(currentAsset, qty, currentPrice, 'crypto');

        if (success) {
            // Success - clear form and show feedback
            setQuantity('');
            alert(`✓ Successfully purchased ${qty} ${currentAsset.toUpperCase()} @ ${formatAmount(convert(currentPrice), currency)}\nWallet balance reduced by ${formatAmount(convert(totalCost), currency)}`);
        } else {
            setBuyError('Transaction failed. Please try again.');
        }
    };

    const handleQuickTrade = (side, amountInUsdt) => {
        const tradePrice = Number(assetSnapshot.price || livePrice || currentPrice || 0);
        if (!tradePrice || amountInUsdt <= 0) return false;

        const tradeQuantity = amountInUsdt / tradePrice;
        const tradeSymbol = primarySymbol;

        if (side === 'sell') {
            const success = sellAsset(tradeSymbol, tradeQuantity, tradePrice, 'crypto');
            if (!success) {
                setBuyError(`Not enough ${tradeSymbol} in your holdings to sell that amount.`);
            } else {
                setBuyError('');
            }
            return success;
        }

        const success = buyAsset(tradeSymbol, tradeQuantity, tradePrice, 'crypto');
        if (!success) {
            setBuyError('Insufficient balance for this trade.');
        } else {
            setBuyError('');
        }
        return success;
    };

    const quickTradeHistory = getRecentTradesForSymbol(primarySymbol, 4);

    return (
        <MainLayout>
            <div className="space-y-6 max-w-[1600px] mx-auto">
                {/* Header Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/markets" className="p-2 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft size={18} />
                        </Link>
                        <h1 className="text-2xl font-bold">Trading Terminal</h1>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-white/5">
                        {['single', 'split-v', 'quad'].map(l => (
                            <button
                                key={l}
                                onClick={() => handleLayoutChange(l)}
                                className={`p-2 rounded-lg transition-all ${layout === l ? 'bg-accent text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            >
                                {l === 'single' && <Maximize2 size={18} />}
                                {l === 'split-v' && <Columns size={18} />}
                                {l === 'quad' && <Grid2X2 size={18} />}
                            </button>
                        ))}
                        <div className="w-[1px] h-6 bg-white/10 mx-1" />
                        <button
                            onClick={() => {
                                localStorage.removeItem(chartLayoutStorageKey);
                                window.location.reload();
                            }}
                            className="p-2 text-slate-500 hover:text-danger rounded-lg transition-all"
                            title="Reset Layout"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className={`grid gap-4 ${layout === 'single' ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1'}`}>
                    <div className={`${layout === 'single' ? 'lg:col-span-3' : ''}`}>
                        <div className={`grid gap-4 ${layout === 'single' ? 'grid-cols-1' :
                            layout === 'split-v' ? 'grid-cols-1 lg:grid-cols-2' :
                                layout === 'quad' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
                            }`}>
                            {configs.map(config => (
                                <ChartInstance
                                    key={config.id}
                                    config={config}
                                    onUpdate={updateConfig}
                                    isSingle={layout === 'single'}
                                    useSharedFeed={primaryAssetType === 'crypto' && config.id === primaryConfig.id}
                                    sharedCandles={config.id === primaryConfig.id ? sharedCandles : []}
                                />
                            ))}
                        </div>
                    </div>

                    {layout === 'single' && (
                        <div className="lg:col-span-1 h-[600px] min-h-0">
                            <TradeIntelPanel
                                symbol={getAssetDisplayName(primarySymbol)}
                                currentPrice={assetSnapshot.price || livePrice || currentPrice}
                                assetStats={assetSnapshot}
                                recentTrades={quickTradeHistory}
                                walletBalance={walletBalance}
                                onSubmitTrade={handleQuickTrade}
                                errorMessage={buyError}
                            />
                        </div>
                    )}
                </div>

            </div>
        </MainLayout>
    );
}
