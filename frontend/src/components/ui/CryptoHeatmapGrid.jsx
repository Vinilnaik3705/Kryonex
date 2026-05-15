import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, ChevronRight, Filter, Flame, MessageCircle, SortAsc, Sparkles, TrendingUp, X } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { formatAmount } from '../../utils/formatCurrency';
import axios from 'axios';
import API_BASE_URL from '../../config/api';
import CoinIcon from './CoinIcon';
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy';

const STABLES = new Set([
    'USDT','USDC','BUSD','DAI','TUSD','FDUSD','RLUSD','USD1',
    'EUR','PYUSD','FRAX','LUSD','USDP','GUSD','HUSD'
]);

const COINS = [
    { symbol: 'BTC', name: 'Bitcoin', price: 96241.12, change24h: 2.8, marketCap: 1900000000000, volume: 34800000000, category: 'Layer 1', sparkline: [94000, 94650, 93980, 95210, 95840, 95120, 96080, 96240] },
    { symbol: 'ETH', name: 'Ethereum', price: 3452.6, change24h: 1.9, marketCap: 415000000000, volume: 19400000000, category: 'Layer 1', sparkline: [3320, 3350, 3315, 3380, 3410, 3390, 3430, 3452] },
    { symbol: 'BNB', name: 'BNB', price: 612.44, change24h: 0.8, marketCap: 94500000000, volume: 1800000000, category: 'Layer 1', sparkline: [600, 604, 606, 601, 608, 610, 611, 612] },
    { symbol: 'SOL', name: 'Solana', price: 182.33, change24h: 5.7, marketCap: 84200000000, volume: 6200000000, category: 'Layer 1', sparkline: [165, 168, 171, 176, 172, 178, 180, 182] },
    { symbol: 'XRP', name: 'XRP', price: 2.41, change24h: -0.7, marketCap: 136000000000, volume: 3800000000, category: 'Layer 1', sparkline: [2.46, 2.45, 2.44, 2.43, 2.42, 2.4, 2.41, 2.41] },
    { symbol: 'DOGE', name: 'Dogecoin', price: 0.2814, change24h: 9.8, marketCap: 41000000000, volume: 5100000000, category: 'Layer 1', sparkline: [0.24, 0.25, 0.245, 0.26, 0.27, 0.274, 0.279, 0.281] },
    { symbol: 'ADA', name: 'Cardano', price: 0.7421, change24h: -3.8, marketCap: 26700000000, volume: 940000000, category: 'Layer 1', sparkline: [0.78, 0.77, 0.765, 0.755, 0.748, 0.744, 0.741, 0.742] },
    { symbol: 'LINK', name: 'Chainlink', price: 18.32, change24h: 4.1, marketCap: 10700000000, volume: 1400000000, category: 'DeFi', sparkline: [17.2, 17.4, 17.8, 17.6, 18.0, 18.1, 18.25, 18.32] },
    { symbol: 'AVAX', name: 'Avalanche', price: 45.71, change24h: -5.5, marketCap: 18900000000, volume: 860000000, category: 'Layer 1', sparkline: [47.8, 47.2, 46.6, 46.0, 45.9, 45.8, 45.7, 45.71] },
    { symbol: 'DOT', name: 'Polkadot', price: 7.12, change24h: 0.2, marketCap: 9800000000, volume: 410000000, category: 'Layer 1', sparkline: [7.08, 7.09, 7.1, 7.09, 7.11, 7.12, 7.12, 7.12] },
    { symbol: 'MATIC', name: 'Polygon', price: 0.594, change24h: -1.6, marketCap: 5600000000, volume: 520000000, category: 'Layer 1', sparkline: [0.61, 0.608, 0.604, 0.6, 0.598, 0.596, 0.595, 0.594] },
    { symbol: 'TON', name: 'Toncoin', price: 6.84, change24h: 3.6, marketCap: 17100000000, volume: 390000000, category: 'Layer 1', sparkline: [6.5, 6.55, 6.6, 6.64, 6.7, 6.76, 6.8, 6.84] },
    { symbol: 'SUI', name: 'Sui', price: 2.88, change24h: 12.4, marketCap: 9800000000, volume: 2100000000, category: 'Layer 1', sparkline: [2.42, 2.5, 2.61, 2.7, 2.8, 2.83, 2.86, 2.88] },
    { symbol: 'ZEC', name: 'Zcash', price: 41.02, change24h: -6.3, marketCap: 670000000, volume: 150000000, category: 'Layer 1', sparkline: [43.8, 43.2, 42.7, 42.1, 41.8, 41.4, 41.1, 41.02] },
    { symbol: 'TRX', name: 'TRON', price: 0.161, change24h: 1.3, marketCap: 14100000000, volume: 470000000, category: 'Layer 1', sparkline: [0.158, 0.159, 0.1595, 0.16, 0.1603, 0.1606, 0.1608, 0.161] },
    { symbol: 'INJ', name: 'Injective', price: 31.52, change24h: 7.4, marketCap: 2900000000, volume: 340000000, category: 'DeFi', sparkline: [29.1, 29.8, 30.1, 30.6, 31.0, 31.2, 31.4, 31.52] },
    { symbol: 'PEPE', name: 'Pepe', price: 0.00001082, change24h: 18.6, marketCap: 4550000000, volume: 1100000000, category: 'DeFi', sparkline: [0.0000087, 0.0000091, 0.0000098, 0.0000102, 0.0000105, 0.0000106, 0.00001075, 0.00001082] },
    { symbol: 'LTC', name: 'Litecoin', price: 96.21, change24h: -2.2, marketCap: 7200000000, volume: 610000000, category: 'Layer 1', sparkline: [98.2, 97.9, 97.4, 97.0, 96.8, 96.4, 96.25, 96.21] },
    { symbol: 'UNI', name: 'Uniswap', price: 10.84, change24h: 4.9, marketCap: 6500000000, volume: 240000000, category: 'DeFi', sparkline: [10.1, 10.2, 10.35, 10.5, 10.62, 10.7, 10.78, 10.84] },
    { symbol: 'ATOM', name: 'Cosmos', price: 8.91, change24h: 0.4, marketCap: 3500000000, volume: 180000000, category: 'Layer 1', sparkline: [8.84, 8.86, 8.87, 8.88, 8.89, 8.9, 8.9, 8.91] },
    { symbol: 'ICP', name: 'Internet Computer', price: 13.48, change24h: -5.9, marketCap: 6200000000, volume: 360000000, category: 'Layer 1', sparkline: [14.4, 14.1, 13.92, 13.75, 13.66, 13.58, 13.5, 13.48] },
    { symbol: 'TAO', name: 'Bittensor', price: 412.77, change24h: 6.2, marketCap: 3000000000, volume: 290000000, category: 'Layer 1', sparkline: [388, 394, 398, 403, 407, 409, 411, 412.77] },
    { symbol: 'FDUSD', name: 'First Digital USD', price: 1.0, change24h: 0.01, marketCap: 2600000000, volume: 980000000, category: 'Stablecoin', sparkline: [0.9998, 1.0001, 0.9999, 1.0002, 1.0, 0.9998, 1.0001, 1.0] },
    { symbol: 'USDC', name: 'USD Coin', price: 1.0, change24h: 0.0, marketCap: 34000000000, volume: 9200000000, category: 'Stablecoin', sparkline: [1, 1, 1, 1, 1, 1, 1, 1] },
    { symbol: 'USDT', name: 'Tether', price: 1.0, change24h: -0.01, marketCap: 111000000000, volume: 33000000000, category: 'Stablecoin', sparkline: [1.0001, 0.9999, 1, 1.0001, 0.9999, 1, 1, 1] },
];

const FILTERS = ['All', 'Top 10', 'Gainers', 'Losers'];
const SORTS = [
    { label: 'Market Cap', value: 'marketCap' },
    { label: '% Change', value: 'change24h' },
    { label: 'Volume', value: 'volume' },
    { label: 'Alphabetical', value: 'alphabetical' },
];

const getMarketStats = (coin, currency, convert) => [
    { label: 'Market Cap', value: formatAmount(convert(coin.marketCap), currency) },
    { label: 'Volume', value: formatAmount(convert(coin.volume), currency) },
    { label: 'Price', value: formatAmount(convert(coin.price), currency) },
    { label: '24h Range', value: `${formatAmount(convert(coin.price * 0.96), currency)} - ${formatAmount(convert(coin.price * 1.04), currency)}` },
];

function Sparkline({ data, color }) {
    if (!data?.length) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const w = 260, h = 60;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / (max - min || 1)) * h;
        return `${x},${y}`;
    }).join(' ');
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function computeTreemap(coins, width, height) {
    if (!coins || coins.length === 0 || width <= 0 || height <= 0) return [];
    
    // Cap any single coin's market cap contribution at 25% of total
    const totalCap = coins.reduce((s, c) => s + Math.max(c.marketCap || 0, 1), 0);
    const maxAllowed = totalCap * 0.25;

    const root = hierarchy({ children: coins })
        .sum(d => {
            if (d.children) return 0;
            const cap = d.marketCap ?? d.market_cap ?? 0;
            // Fallback to price * 1M, and cap at maxAllowed
            return Math.min(Math.max(cap, (d.price || 0) * 1_000_000 || 1_000_000), maxAllowed);
        })
        .sort((a, b) => b.value - a.value);

    treemap()
        .size([width, height])
        .tile(treemapSquarify)
        .padding(2)(root);

    return root.leaves().map(leaf => ({
        ...leaf.data,
        x: leaf.x0,
        y: leaf.y0,
        width: leaf.x1 - leaf.x0,
        height: leaf.y1 - leaf.y0,
        id: leaf.data.symbol, // important for keys
    }));
}

function changeToColor(change) {
    // clamp to [-10, +10] range for color intensity
    const clamped = Math.max(-10, Math.min(10, change));
    if (clamped > 0.1) {
        // 0 → #1a3a2a, +10 → #00c853
        const t = clamped / 10;
        return `rgb(${Math.round(26 + t * (0 - 26))}, ${Math.round(58 + t * (200 - 58))}, ${Math.round(42 + t * (83 - 42))})`;
    } else if (clamped < -0.1) {
        // 0 → #3a1a1a, -10 → #d50000
        const t = Math.abs(clamped) / 10;
        return `rgb(${Math.round(58 + t * (213 - 58))}, ${Math.round(26 + t * (0 - 26))}, ${Math.round(26 + t * (0 - 26))})`;
    }
    // Neutral zone (±0.1%) → #1e2a35
    return '#1e2a35';
}

function HeatmapTile({ coin, onClick, isSelected, currency, convert, formatAmount }) {
    const bg = changeToColor(coin.change24h);
    const { width, height } = coin;
    const area = width * height;
    const minDim = Math.min(width, height);
    const maxDim = Math.max(width, height);

    // --- Size tiers based on AREA, not just minDim ---
    const isMicro  = area < 1200;           // < ~35×35 — colored block only
    const isSmall  = area < 6000;           // ~55×80 — symbol + change
    const isMedium = area < 12000;          // ~80×120 — symbol + change
    // large: everything

    const isNarrow = width < 50;

    if (isMicro) {
        return (
            <div
                title={`${coin.symbol}: ${coin.change24h >= 0 ? '+' : ''}${coin.change24h.toFixed(2)}%`}
                onClick={() => onClick(coin.symbol)}
                style={{
                    position: 'absolute', left: coin.x, top: coin.y,
                    width: coin.width, height: coin.height,
                    background: bg,
                    border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(0,0,0,0.35)',
                    borderRadius: 3, cursor: 'pointer', boxSizing: 'border-box',
                    transition: 'filter 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.3)'}
                onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
            />
        );
    }

    // Font sizes: scale aggressively with area
    const symSize    = Math.max(8, Math.min(maxDim * 0.18, minDim * 0.28, 20));
    const changeSize = Math.max(7, Math.min(maxDim * 0.13, minDim * 0.20, 14));
    const priceSize  = Math.max(6, Math.min(maxDim * 0.10, minDim * 0.15, 11));

    // For very narrow tall tiles, rotate content
    const useVertical = isNarrow && height > width * 1.5;

    return (
        <div
            title={`${coin.symbol} | ${coin.change24h >= 0 ? '+' : ''}${coin.change24h.toFixed(2)}% | ${formatAmount(convert(coin.price), currency)}`}
            onClick={() => onClick(coin.symbol)}
            style={{
                position: 'absolute', left: coin.x, top: coin.y,
                width: coin.width, height: coin.height,
                background: bg,
                border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(0,0,0,0.35)',
                borderRadius: 3, cursor: 'pointer', boxSizing: 'border-box',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: Math.max(2, minDim * 0.05),
                overflow: 'hidden',
                transition: 'filter 0.15s',
                ...(useVertical ? { writingMode: 'vertical-rl', textOrientation: 'mixed' } : {}),
            }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.25)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
        >
            {/* SYMBOL — always shown (we're past isMicro) */}
            <span style={{
                fontSize: symSize,
                fontWeight: 700,
                color: '#fff',
                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                letterSpacing: symSize > 14 ? '0.02em' : 0,
                lineHeight: 1.15,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                display: 'block',
                textAlign: 'center',
            }}>
                {coin.symbol}
            </span>

            {/* CHANGE % — shown on small and above */}
            {!isSmall && (
                <span style={{
                    fontSize: changeSize,
                    fontWeight: 600,
                    color: coin.change24h >= 0 ? '#86efca' : '#fca5a5',
                    fontFamily: 'JetBrains Mono, monospace',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    textAlign: 'center',
                    marginTop: 1,
                }}>
                    {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                </span>
            )}

            {/* PRICE — only on large tiles */}
            {!isMedium && (
                <span style={{
                    fontSize: priceSize,
                    color: 'rgba(255,255,255,0.6)',
                    fontFamily: 'JetBrains Mono, monospace',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    display: 'block',
                    textAlign: 'center',
                    marginTop: 1,
                }}>
                    {formatAmount(convert(coin.price), currency)}
                </span>
            )}
        </div>
    );
}

export default function CryptoHeatmapGrid() {
    const [filter, setFilter] = useState('All');
    const [hideStables, setHideStables] = useState(true);
    const [sortBy, setSortBy] = useState('marketCap');
    const [selectedSymbol, setSelectedSymbol] = useState('BTC');
    const { currency, convert } = useCurrency();
    const [marketData, setMarketData] = useState([]);
    const [loading, setLoading] = useState(true);

    const containerRef = useRef(null);
    const [dims, setDims] = useState({ width: 0, height: 0 });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    useEffect(() => {
        const ro = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            setDims({ width, height });
        });
        if (containerRef.current) ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        const fetchMarketData = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/crypto/market-cap?limit=50`);
                if (response.data.success) {
                    const formatted = response.data.data.map(item => {
                        const current = item.price;
                        const change = item.changePercent;
                        const start = current / (1 + (change / 100));
                        const sparkline = Array.from({ length: 8 }).map((_, i) => {
                            if (i === 0) return start;
                            if (i === 7) return current;
                            const progress = i / 7;
                            const base = start + (current - start) * progress;
                            const noise = base * 0.005 * (Math.random() - 0.5);
                            return base + noise;
                        });

                        return {
                            symbol: item.baseAsset,
                            name: item.baseAsset,
                            price: item.price,
                            change24h: item.changePercent,
                            marketCap: item.quoteVolume * 100,
                            volume: item.volume,
                            category: 'Crypto',
                            sparkline: sparkline
                        };
                    });
                    setMarketData(formatted);

                    // Update selected symbol if the current one doesn't exist in new data
                    setSelectedSymbol(prev => {
                        if (!formatted.find(c => c.symbol === prev)) {
                            return formatted[0]?.symbol || 'BTC';
                        }
                        return prev;
                    });
                }
            } catch (error) {
                console.error("Heatmap data fetch failed", error);
                setMarketData(COINS);
            } finally {
                setLoading(false);
            }
        };

        fetchMarketData();
        const interval = setInterval(fetchMarketData, 15000);
        return () => clearInterval(interval);
    }, []);

    const visibleCoins = useMemo(() => {
        let items = marketData.length > 0 ? [...marketData] : [...COINS];

        if (hideStables) {
            items = items.filter((coin) => !STABLES.has(coin.symbol.toUpperCase()));
        }

        if (filter === 'Top 10') {
            items = items.sort((a, b) => b.marketCap - a.marketCap).slice(0, 10);
        } else if (filter === 'Gainers') {
            items = items.filter((coin) => coin.change24h > 0);
        } else if (filter === 'Losers') {
            items = items.filter((coin) => coin.change24h < 0);
        }

        return items.sort((a, b) => {
            switch (sortBy) {
                case 'change24h':
                    return b.change24h - a.change24h;
                case 'volume':
                    return b.volume - a.volume;
                case 'alphabetical':
                    return a.symbol.localeCompare(b.symbol);
                case 'marketCap':
                default:
                    return b.marketCap - a.marketCap;
            }
        });
    }, [filter, hideStables, sortBy, marketData]);

    const selectedCoin = visibleCoins.find((coin) => coin.symbol === selectedSymbol) || visibleCoins[0] || COINS[0];

    const tiles = useMemo(() =>
        dims.width > 0 ? computeTreemap(visibleCoins, dims.width, dims.height) : [],
        [visibleCoins, dims]
    );

    const validTiles = useMemo(() => {
        return tiles.filter(tile =>
            tile.width > 1 &&
            tile.height > 1 &&
            tile.x < dims.width &&
            tile.y < dims.height
        );
    }, [tiles, dims]);

    const visibleTiles = useMemo(() => {
        return validTiles.filter(t => t.width * t.height >= 900);
    }, [validTiles]);

    const hiddenCount = validTiles.length - visibleTiles.length;

    return (
        <div className="space-y-4 max-h-screen pb-4">
            <div className="flex flex-col gap-4 rounded-3xl border border-white/[0.08] bg-black p-4 sm:p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-2.5 text-sky-300 shadow-[0_0_24px_rgba(56,189,248,0.18)]">
                            <BarChart3 size={18} />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-white leading-none">Crypto Treemap</h1>
                            <p className="text-[11px] sm:text-sm text-slate-400 mt-1 opacity-50">Proportional market visualization by capitalization and 24h performance.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-white/5 pb-4">
                    <div className="flex flex-wrap gap-2">
                        {FILTERS.map((item) => {
                            const active = filter === item;
                            return (
                                <button
                                    key={item}
                                    onClick={() => setFilter(item)}
                                    className={`inline-flex items-center gap-2 rounded-full border px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-semibold transition-all ${active
                                        ? 'border-sky-400/40 bg-sky-400 text-black shadow-[0_0_24px_rgba(56,189,248,0.25)]'
                                        : 'border-white/[0.08] bg-white/[0.03] text-slate-300 hover:border-sky-400/30 hover:text-white'
                                        }`}
                                >
                                    <Filter size={14} />
                                    {item}
                                </button>
                            );
                        })}
                        <div className="w-px h-6 bg-white/10 mx-1 self-center hidden sm:block" />
                        <button
                            onClick={() => setHideStables(!hideStables)}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-semibold transition-all ${hideStables
                                ? 'border-amber-400/40 bg-amber-400/10 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.1)]'
                                : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white'
                                }`}
                        >
                            Hide Stables {hideStables ? '(ON)' : '(OFF)'}
                        </button>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/[0.03] px-4 py-2.5 sm:py-3 self-start lg:self-auto">
                        <div className="flex items-center gap-2 th-label">
                            <SortAsc size={14} /> Sort
                        </div>
                        <select
                            value={sortBy}
                            onChange={(event) => setSortBy(event.target.value)}
                            className="bg-transparent text-sm font-semibold text-white outline-none"
                        >
                            {SORTS.map((item) => (
                                <option key={item.value} value={item.value} className="bg-black text-white">
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                
                {/* Color Legend */}
                <div className="flex items-center gap-3 text-[10px] sm:text-[11px] text-[rgba(255,255,255,0.4)] px-1 flex-wrap">
                  <span>-10%</span>
                  <div className="flex-1 max-w-[160px] h-2 rounded-full bg-gradient-to-right from-[#d50000] via-[#1e2a35] to-[#00c853]" 
                       style={{ background: 'linear-gradient(to right, #d50000, #3a1a1a, #1e2a35, #1a3a2a, #00c853)' }} />
                  <span>+10%</span>
                  <span className="ml-auto opacity-60">Block size = Market Cap</span>
                </div>
            </div>

            <div className={`flex flex-col ${isMobile ? '' : 'lg:flex-row'} gap-4 sm:gap-6`} style={{ height: isMobile ? 'auto' : 'calc(100vh - 280px)', minHeight: isMobile ? 'none' : 600 }}>
                {/* Treemap Container */}
                <div 
                    ref={containerRef} 
                    className="flex-1 relative rounded-3xl border border-[rgba(255,255,255,0.06)] bg-black"
                    style={{ 
                        overflow: 'hidden', 
                        height: isMobile ? '70vw' : '100%',
                        minHeight: 350
                    }}
                >
                    {visibleTiles.map(tile => (
                        <HeatmapTile 
                            key={tile.id} 
                            coin={tile}
                            isSelected={selectedSymbol === tile.symbol}
                            onClick={setSelectedSymbol}
                            currency={currency} 
                            convert={convert}
                            formatAmount={formatAmount}
                        />
                    ))}
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500 bg-black/50 backdrop-blur-sm z-20">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
                                <span className="text-sm font-medium">Syncing live market data...</span>
                            </div>
                        </div>
                    )}
                    {!loading && visibleTiles.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                            No coins match the active filters.
                        </div>
                    )}
                    {hiddenCount > 0 && (
                        <div className="absolute bottom-3 right-3 rounded-full bg-black/80 px-3 py-1.5 text-[10px] sm:text-xs font-bold text-slate-400 border border-white/10 backdrop-blur-md z-10 pointer-events-none shadow-lg">
                            + {hiddenCount} more hidden
                        </div>
                    )}
                </div>

                <aside className={`${isMobile ? 'w-full' : 'lg:w-[340px] xl:w-[380px]'} flex-shrink-0 rounded-3xl border border-[rgba(255,255,255,0.06)] bg-black p-4 sm:p-5 h-full overflow-y-auto`}>
                    <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-4">
                        <div className="flex items-center gap-3">
                            <CoinIcon symbol={selectedCoin.symbol} size={36} />
                            <div>
                                <p className="text-[10px] font-bold text-accent uppercase tracking-widest opacity-60">Selected Asset</p>
                                <h2 className="text-2xl font-black text-white">{selectedCoin.symbol}</h2>
                            </div>
                        </div>
                        <div className={`rounded-full p-2 ${selectedCoin.change24h >= 0 ? 'bg-success/[0.15] text-success shadow-[0_0_12px_rgba(34,211,160,0.15)]' : 'bg-danger/[0.15] text-danger shadow-[0_0_12px_rgba(244,63,94,0.15)]'}`}>
                            {selectedCoin.change24h >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                        </div>
                    </div>

                    <div className="mt-5 space-y-4">
                        <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/[0.03] p-4">
                            <p className="text-[10px] tracking-widest text-[rgba(255,255,255,0.3)] font-bold uppercase mb-2">Live Price</p>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-2xl sm:text-3xl font-extrabold font-mono price-mono text-white truncate">
                                        {formatAmount(convert(selectedCoin.price), currency)}
                                    </p>
                                </div>
                                <div className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold font-mono price-mono ${selectedCoin.change24h >= 0 ? 'bg-success/[0.15] text-success' : 'bg-danger/[0.15] text-danger'}`}>
                                    {selectedCoin.change24h > 0 ? '+' : ''}{selectedCoin.change24h.toFixed(2)}%
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-xs font-bold text-white opacity-60 uppercase tracking-widest">24h Trend</p>
                                <Activity size={14} className={selectedCoin.change24h >= 0 ? 'text-[#22d3a0]' : 'text-[#f43f5e]'} />
                            </div>
                            <div className="flex justify-center py-2">
                                <Sparkline 
                                    data={selectedCoin.sparkline} 
                                    color={selectedCoin.change24h >= 0 ? '#22d3a0' : '#f43f5e'} 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {getMarketStats(selectedCoin, currency, convert).map((stat) => (
                                <div key={stat.label} className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-white/[0.03] p-3">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                    <p className="mt-1 font-mono price-mono text-[12px] font-bold text-white truncate">{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4 text-xs text-slate-300 leading-relaxed">
                            <div className="mb-2 flex items-center gap-2 text-sky-300 font-bold uppercase tracking-widest text-[10px]">
                                <Sparkles size={14} />
                                Market Insight
                            </div>
                            {STABLES.has(selectedSymbol.toUpperCase())
                                ? `The ${selectedCoin.symbol} stablecoin is currently holding its peg at ${formatAmount(convert(selectedCoin.price), currency)}.`
                                : `${selectedCoin.symbol} is currently showing ${selectedCoin.change24h >= 0 ? 'bullish' : 'bearish'} momentum with a ${Math.abs(selectedCoin.change24h).toFixed(2)}% move today.`}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}