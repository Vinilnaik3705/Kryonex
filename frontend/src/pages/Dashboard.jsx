import React from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '../layouts/MainLayout';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, TrendingDown, Activity, Shield, Zap, ArrowRight, MessageCircle } from 'lucide-react';
import BentoCard from '../components/ui/BentoCard';
import CoinIcon from '../components/ui/CoinIcon';
import useWalletAndPortfolio from '../hooks/useWalletAndPortfolio';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import MarketToggle from '../components/ui/MarketToggle';
import CryptoChatbot from '../components/CryptoChatbot';
import API_BASE_URL from '../config/api';
import { useCurrency } from '../context/CurrencyContext';
import { formatAmount } from '../utils/formatCurrency';

const ASSET_COLORS = {
    'BTC': '#F7931A', 'ETH': '#3B82F6', 'SOL': '#9333EA', 'BNB': '#f0b90b',
    'XRP': '#00aae4', 'DOGE': '#c2a633', 'ADA': '#0033ad', 'DOT': '#e6007a',
    'AVAX': '#e84142', 'LINK': '#2a5ada', 'MATIC': '#8247e5', 'ATOM': '#2e3148',
    'UNI': '#ff007a', 'LTC': '#bfbbbb', 'TRX': '#ff0013', 'TON': '#0098ea',
    'SUI': '#4da2ff', 'INJ': '#00c2ff', 'ICP': '#29abe2', 'TAO': '#00d4aa',
    'PUMP': '#a855f7', 'PEPE': '#22c55e', 'SHIB': '#e84142', 'BONK': '#f97316',
    'FLOKI': '#e4a20c', 'DOGS': '#3b82f6', 'LUNC': '#f4bc2f', 'ZEC': '#f4b728',
};

const getAssetColor = (symbol) => {
    return ASSET_COLORS[symbol?.toUpperCase()] || `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
};

// Helper function to convert timestamp to "X hours ago" format
function getTimeAgo(timestamp) {
    const now = new Date();
    const published = new Date(timestamp);
    const diffMs = now - published;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
        return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
}

export default function Dashboard() {
    const navigate = useNavigate();
    const { walletBalance, calculatePortfolioValue, calculateTotalPnL, getHoldingsWithValues } = useWalletAndPortfolio();
        const { currency, convert } = useCurrency();
    const { data: marketData = [], isLoading: loading } = useQuery({
        queryKey: ['dashboard-market'],
        queryFn: async () => {
            const response = await axios.get(`${API_BASE_URL}/crypto/market-cap?limit=5`, { timeout: 4000 });
            if (!response.data.success) throw new Error('Market data unavailable');
            return response.data.data.map(item => ({
                id: item.symbol,
                name: item.baseAsset,
                symbol: item.baseAsset,
                price: item.price,
                change: item.changePercent
            }));
        },
        staleTime: 15000,
        refetchInterval: 15000,
    });
    const { data: news = [], isLoading: newsLoading } = useQuery({
        queryKey: ['dashboard-news'],
        queryFn: async () => {
            const response = await axios.get(`${API_BASE_URL}/news?limit=10`, { timeout: 5000 });
            if (!response.data.success) throw new Error('News unavailable');
            return response.data.data;
        },
        staleTime: 60000,
        refetchInterval: 60000,
    });

    // Calculate values
    const portfolioValue = calculatePortfolioValue();
    const totalPnL = calculateTotalPnL();
    const totalAssets = walletBalance + portfolioValue;
    const pnlPercent = totalAssets > 0 ? (totalPnL / (totalAssets - totalPnL)) * 100 : 0;

    // Build data from real holdings
    const allHoldings = getHoldingsWithValues();

    return (
        <MainLayout>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 px-4 sm:px-0">
                    <div>
                        <h2 className="text-xl font-bold text-text-main font-heading">Dashboard</h2>
                        <p className="text-text-dim mt-0.5 text-[12px]">Crypto market overview & analysis</p>
                    </div>
                </div>

                {/* Stat Cards Grid - Responsive fix */}
                <div
                    className="grid gap-3 px-4 sm:px-0 w-full box-border"
                    style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
                >
                    {/* AVAILABLE BALANCE */}
                    <div className="glass-card rounded-2xl p-4 border border-border min-w-0 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 relative">
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-brand-gradient" />
                        <div className="th-label text-text-dim mb-2 font-heading font-bold text-[10px] tracking-widest">
                            AVAILABLE BALANCE
                        </div>
                        <div className="text-[22px] font-extrabold text-text-main font-mono price-mono tracking-tight">
                            {formatAmount(convert(walletBalance), currency)}
                        </div>
                        <div className="text-[11px] text-brand-600 mt-1 font-bold">Cash ready</div>
                    </div>

                    {/* PORTFOLIO VALUE */}
                    <div className="glass-card rounded-2xl p-4 border border-border min-w-0 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 relative">
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
                        <div className="th-label text-text-dim mb-2 font-heading font-bold text-[10px] tracking-widest">
                            PORTFOLIO VALUE
                        </div>
                        <div className="text-[22px] font-extrabold text-text-main font-mono price-mono tracking-tight">
                            {formatAmount(convert(portfolioValue), currency)}
                        </div>
                        <div className="text-[11px] text-success mt-1 font-bold">Holdings active</div>
                    </div>

                    {/* TOTAL P&L */}
                    <div className="glass-card rounded-2xl p-4 border border-border min-w-0 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 relative">
                        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: totalPnL >= 0 ? '#10B981' : '#F43F5E' }} />
                        <div className="th-label text-text-dim mb-2 font-heading font-bold text-[10px] tracking-widest">
                            TOTAL P&L
                        </div>
                        <div className="text-[22px] font-extrabold font-mono price-mono tracking-tight" style={{ color: totalPnL >= 0 ? '#10B981' : '#F43F5E' }}>
                            {totalPnL >= 0 ? '+' : ''}{formatAmount(convert(totalPnL), currency)}
                        </div>
                        <div className="text-[11px] mt-1 font-bold" style={{ color: totalPnL >= 0 ? '#10B981' : '#F43F5E' }}>
                            {totalPnL >= 0 ? '↑' : '↓'} {pnlPercent.toFixed(2)}%
                        </div>
                    </div>

                    {/* OPEN POSITIONS */}
                    <div className="glass-card rounded-2xl p-4 border border-border min-w-0 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 relative">
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500" />
                        <div className="th-label text-text-dim mb-2 font-heading font-bold text-[10px] tracking-widest">
                            OPEN POSITIONS
                        </div>
                        <div className="text-[22px] font-extrabold text-text-main font-mono price-mono tracking-tight">
                            {allHoldings.length}
                        </div>
                        <div className="text-[11px] text-warning mt-1 font-bold">Active trades</div>
                    </div>
                </div>

                {/* Row 2 - Feature Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {/* Market News - Spans 2 cols on desktop */}
                    <BentoCard className="lg:col-span-2 min-h-[350px] sm:min-h-[400px]" icon={Zap} title="Market News" delay={0.4}>
                        <div className="w-full mt-4 space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                            {newsLoading ? (
                                <div className="flex items-center justify-center h-[320px]">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                                </div>
                            ) : news.length === 0 ? (
                                <div className="flex items-center justify-center h-[320px] text-text-muted">
                                    No news available
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {news.slice(0, 6).map((article) => {
                                        const timeAgo = getTimeAgo(article.publishedAt);
                                        return (
                                            <a
                                                key={article.id}
                                                href={article.url || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    background: 'var(--color-hover)',
                                                    borderRadius: 12,
                                                    padding: '14px 16px',
                                                    border: '1px solid var(--color-border)',
                                                    display: 'block',
                                                    width: '100%',
                                                    boxSizing: 'border-box',
                                                    textDecoration: 'none',
                                                    transition: 'all 0.2s'
                                                }}
                                                className="hover:bg-secondary hover:border-brand-200 transition-all group"
                                            >
                                                <p style={{
                                                    margin: '0 0 10px',
                                                    fontSize: 'clamp(13px, 3.8vw, 15px)',
                                                    fontWeight: 700,
                                                    lineHeight: 1.5,
                                                    color: 'var(--color-text)',
                                                    wordBreak: 'break-word',
                                                }}>
                                                    {article.title}
                                                </p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                    <span style={{
                                                         background: 'var(--color-surface-2)',
                                                         color: 'var(--color-accent)',
                                                         borderRadius: 6,
                                                         padding: '2px 10px',
                                                         fontSize: 10,
                                                         fontWeight: 800,
                                                         textTransform: 'uppercase',
                                                         letterSpacing: '0.05em'
                                                     }}>
                                                         {article.category}
                                                    </span>
                                                    <span style={{
                                                        fontSize: 11,
                                                        color: 'var(--color-text-dim)',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        maxWidth: '60%',
                                                        fontWeight: 500
                                                    }}>
                                                        {article.source} • {timeAgo}
                                                    </span>
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </BentoCard>

                    {/* Asset Allocation */}
                    <BentoCard icon={Shield} title="Asset Allocation" delay={0.5}>
                        {allHoldings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                                <Shield size={32} className="mb-3 opacity-30" />
                                <p className="font-medium text-sm">No holdings yet</p>
                                <p className="text-[11px] mt-1">Start trading to see your allocation</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-1 xl:grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                                {allHoldings.sort((a, b) => b.currentValue - a.currentValue).map((item) => {
                                    const allocation = portfolioValue > 0 ? ((item.currentValue / portfolioValue) * 100) : 0;
                                    const isProfit = item.pnl >= 0;
                                    const assetColor = getAssetColor(item.symbol);
                                    
                                    return (
                                        <div key={item.symbol} className="bg-hover rounded-xl p-3 sm:p-4 border border-border hover:border-brand-200 transition-all flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <CoinIcon symbol={item.symbol} size={32} />
                                                    <div>
                                                        <h3 className="font-bold text-text-main text-[13px]">{item.symbol}</h3>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-[10px] text-text-muted font-mono price-mono">{item.quantity.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                                                            <span className="text-[9px] text-text-dim uppercase">@</span>
                                                            <span className="text-[10px] text-text-muted font-mono price-mono">{formatAmount(convert(item.buyPrice), currency)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-text-main font-mono price-mono text-[13px] block">{formatAmount(convert(item.currentValue), currency)}</span>
                                                    <div className={`font-mono price-mono font-bold text-[10px] flex justify-end gap-1 mt-0.5 ${isProfit ? 'text-success' : 'text-danger'}`}>
                                                        {isProfit ? '+' : ''}{item.pnlPercent.toFixed(1)}%
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Allocation Bar */}
                                            <div className="w-full">
                                                <div className="flex justify-between text-[9px] font-bold text-text-dim mb-1.5">
                                                    <span className="uppercase tracking-widest">Weight</span>
                                                    <span>{allocation.toFixed(1)}%</span>
                                                </div>
                                                <div className="h-1 w-full bg-secondary rounded-full overflow-hidden border border-border">
                                                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${allocation}%`, backgroundColor: assetColor }} />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 w-full">
                                                <button
                                                    onClick={() => navigate(`/trade/${item.symbol}`)}
                                                    className="flex-1 px-2 py-1.5 bg-success/10 hover:bg-success/20 text-success rounded-lg font-bold text-[10px] transition-colors border border-success/20"
                                                >
                                                    Buy
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/trade/${item.symbol}`)}
                                                    className="flex-1 px-2 py-1.5 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg font-bold text-[10px] transition-colors border border-danger/20"
                                                >
                                                    Sell
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const pnlStr = isProfit ? 'up' : 'down';
                                                        const message = `I hold ${item.symbol} and I'm ${pnlStr} ${Math.abs(item.pnlPercent).toFixed(1)}%. Should I take profits or hold?`;
                                                        window.dispatchEvent(new CustomEvent('open-crypto-chat', { detail: { message } }));
                                                    }}
                                                    className="px-2 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 rounded-lg font-bold text-[10px] transition-colors border border-brand-500/20 flex items-center justify-center"
                                                    title="Ask AI"
                                                >
                                                    <MessageCircle size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </BentoCard>
                </div>

                {/* Market List */}
                <BentoCard className="min-h-[300px]" delay={0.6}>
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <h3 className="text-xl font-bold text-text-main">Live Markets</h3>
                        <div className="flex items-center gap-3">
                            <MarketToggle />
                            <Link to="/markets" className="text-[12px] text-brand-600 hover:text-brand-700 transition-colors font-bold uppercase tracking-widest flex items-center gap-1.5">
                                View All <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                        <table className="w-full min-w-[500px] sm:min-w-0">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-3 px-3 th-label">Asset</th>
                                    <th className="text-right py-3 px-3 th-label">Price</th>
                                    <th className="text-right py-3 px-3 th-label hidden sm:table-cell">24h Change</th>
                                    <th className="text-right py-3 px-3 th-label">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4" className="py-12 text-center text-text-dim text-sm">Synchronizing real-time data...</td></tr>
                                ) : marketData.map((asset) => (
                                    <tr key={asset.id} className="hover:bg-hover transition-colors group border-b border-border">
                                        <td className="py-4 px-3">
                                            <div className="flex items-center gap-3">
                                                <CoinIcon symbol={asset.symbol} size={32} />
                                                <div>
                                                    <p className="font-bold text-[13px] text-text-main leading-none mb-1">{asset.name}</p>
                                                    <p className="text-[10px] text-text-dim uppercase tracking-widest">{asset.symbol}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-right py-4 px-3 font-mono price-mono font-bold text-text-main text-[13px]">
                                            {formatAmount(convert(asset.price), currency)}
                                        </td>
                                        <td className={`text-right py-4 px-3 font-mono price-mono font-bold text-[12px] hidden sm:table-cell ${asset.change >= 0 ? 'text-success' : 'text-danger'}`}>
                                            <span className="flex items-center justify-end gap-1">
                                                {asset.change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                                {Math.abs(asset.change).toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="text-right py-4 px-3">
                                            <Link to={`/trade/${asset.symbol}`} className="bg-hover hover:bg-brand-gradient hover:text-white border border-border hover:border-brand-500 px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all inline-block uppercase tracking-wider">
                                                Trade
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </BentoCard>
            </div>
            <CryptoChatbot />
        </MainLayout>
    );
}
