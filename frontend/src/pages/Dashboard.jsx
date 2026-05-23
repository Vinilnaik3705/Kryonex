import React, { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, Wallet, TrendingUp, TrendingDown, Activity, Shield, Zap, ArrowRight, MessageCircle } from 'lucide-react';
import BentoCard from '../components/ui/BentoCard';
import CoinIcon from '../components/ui/CoinIcon';
import useWalletAndPortfolio from '../hooks/useWalletAndPortfolio';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import MarketToggle from '../components/ui/MarketToggle';
import CryptoChatbot from '../components/CryptoChatbot';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import { formatPrice } from '../utils/formatPrice';
import { useCurrency } from '../context/CurrencyContext';
import { formatAmount } from '../utils/formatCurrency';

const ASSET_COLORS = {
    'BTC': '#F59E0B',
    'ETH': '#3B82F6',
    'TSLA': '#EF4444',
    'AAPL': '#10B981',
    'SOL': '#9333EA',
    'MSFT': '#06B6D4',
    'NVDA': '#EC4899',
    'GOOGL': '#8B5CF6',
    'AMZN': '#14B8A6'
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

// News Item Component
const NewsItem = ({ id, title, source, time, category, url }) => {
    const categoryColors = {
        'Economy': 'bg-blue-500/20 text-blue-400',
        'Markets': 'bg-green-500/20 text-green-400',
        'Commodities': 'bg-yellow-500/20 text-yellow-400',
        'Crypto': 'bg-purple-500/20 text-purple-400',
        'Global': 'bg-cyan-500/20 text-cyan-400'
    };
    return (
        <a href={url || '#'} target="_blank" rel="noopener noreferrer" className="p-4 block bg-tertiary/30 border border-border rounded-lg hover:bg-tertiary/50 transition-all group cursor-pointer">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <h3 className="font-bold text-text-main text-base group-hover:text-accent transition-colors line-clamp-2">{title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${categoryColors[category] || 'bg-slate-700 text-slate-300'}`}>{category}</span>
                        <span className="text-xs text-text-muted">{source}</span>
                        <span className="text-xs text-text-muted">•</span>
                        <span className="text-xs text-text-muted">{time}</span>
                    </div>
                </div>
            </div>
        </a>
    );
};

export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { walletBalance, calculatePortfolioValue, calculateTotalPnL, getHoldingsWithValues } = useWalletAndPortfolio();
        const { currency, convert } = useCurrency();
    const [marketData, setMarketData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [news, setNews] = useState([]);
    const [newsLoading, setNewsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Calculate values
    const portfolioValue = calculatePortfolioValue();
    const totalPnL = calculateTotalPnL();
    const totalAssets = walletBalance + portfolioValue;
    const pnlPercent = totalAssets > 0 ? (totalPnL / (totalAssets - totalPnL)) * 100 : 0;

    // Build data from real holdings
    const allHoldings = getHoldingsWithValues();

    // Fetch crypto market data with auto-refresh
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_BASE_URL}/crypto/market-cap?limit=5`);
                if (response.data.success) {
                    const formatted = response.data.data.map(item => ({
                        id: item.symbol,
                        name: item.baseAsset,
                        symbol: item.baseAsset,
                        price: item.price,
                        change: item.changePercent
                    }));
                    setMarketData(formatted);
                }
            } catch (error) {
                console.error("Dashboard data fetch failed", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();

        // Auto-refresh every 10 seconds for near real-time data
        const interval = setInterval(fetchDashboardData, 10000);
        return () => clearInterval(interval);
    }, []);

    // Fetch real-time news
    const fetchNews = async () => {
        try {
            setRefreshing(true);
            const response = await axios.get(`${API_BASE_URL}/news?category=crypto&limit=10`);
            if (response.data.success) {
                setNews(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch news:', error);
        } finally {
            setNewsLoading(false);
            setRefreshing(false);
        }
    };

    // Initial news fetch
    useEffect(() => {
        fetchNews();
    }, []);

    // Auto-refresh news every 1 minute
    useEffect(() => {
        const interval = setInterval(() => {
            fetchNews();
        }, 60 * 1000); // 1 minute

        return () => clearInterval(interval);
    }, []);

    return (
        <MainLayout>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 px-4 sm:px-0">
                    <div>
                        <h2 className="text-xl font-extrabold text-white">Dashboard</h2>
                        <p className="text-[rgba(255,255,255,0.3)] mt-0.5 text-[12px]">Crypto market overview & analysis</p>
                    </div>
                    {user?.role === 'admin' && (
                        <Link to="/payment" className="bg-accent hover:bg-sky-400 text-black text-sm px-5 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto">
                            <Wallet size={16} /> Add Funds (Admin)
                        </Link>
                    )}
                </div>

                {/* Stat Cards Grid - Responsive fix */}
                <div
                    className="grid gap-3 px-4 sm:px-0 w-full box-border"
                    style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
                >
                    {/* AVAILABLE BALANCE */}
                    <div style={{
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: 14,
                        padding: '14px 16px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderTop: '2px solid #38bdf8',
                        minWidth: 0,
                        overflow: 'hidden',
                    }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 700 }}>
                            AVAILABLE BALANCE
                        </div>
                        <div style={{
                            fontSize: 'clamp(14px, 4.5vw, 22px)',
                            fontWeight: 800,
                            color: '#fff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontFamily: 'JetBrains Mono, monospace'
                        }}>
                            {formatAmount(convert(walletBalance), currency)}
                        </div>
                        <div style={{ fontSize: 11, color: '#38bdf8', marginTop: 4, fontWeight: 600 }}>Cash ready</div>
                    </div>

                    {/* PORTFOLIO VALUE */}
                    <div style={{
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: 14,
                        padding: '14px 16px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderTop: '2px solid #22d3a0',
                        minWidth: 0,
                        overflow: 'hidden',
                    }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 700 }}>
                            PORTFOLIO VALUE
                        </div>
                        <div style={{
                            fontSize: 'clamp(14px, 4.5vw, 22px)',
                            fontWeight: 800,
                            color: '#fff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontFamily: 'JetBrains Mono, monospace'
                        }}>
                            {formatAmount(convert(portfolioValue), currency)}
                        </div>
                        <div style={{ fontSize: 11, color: '#22d3a0', marginTop: 4, fontWeight: 600 }}>Holdings active</div>
                    </div>

                    {/* TOTAL P&L */}
                    <div style={{
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: 14,
                        padding: '14px 16px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderTop: `2px solid ${totalPnL >= 0 ? '#22d3a0' : '#f43f5e'}`,
                        minWidth: 0,
                        overflow: 'hidden',
                    }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 700 }}>
                            TOTAL P&L
                        </div>
                        <div style={{
                            fontSize: 'clamp(12px, 3.5vw, 18px)',
                            fontWeight: 800,
                            color: totalPnL >= 0 ? '#22d3a0' : '#f43f5e',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontFamily: 'JetBrains Mono, monospace'
                        }}>
                            {totalPnL >= 0 ? '+' : ''}{formatAmount(convert(totalPnL), currency)}
                        </div>
                        <div style={{ fontSize: 11, color: totalPnL >= 0 ? '#22d3a0' : '#f43f5e', marginTop: 4, fontWeight: 600 }}>
                            {totalPnL >= 0 ? '↑' : '↓'} {pnlPercent.toFixed(2)}%
                        </div>
                    </div>

                    {/* OPEN POSITIONS */}
                    <div style={{
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: 14,
                        padding: '14px 16px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderTop: '2px solid #f59e0b',
                        minWidth: 0,
                        overflow: 'hidden',
                    }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 700 }}>
                            OPEN POSITIONS
                        </div>
                        <div style={{ fontSize: 'clamp(18px, 6vw, 28px)', fontWeight: 800, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>
                            {allHoldings.length}
                        </div>
                        <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4, fontWeight: 600 }}>Active trades</div>
                    </div>
                </div>

                {/* Row 2 - Feature Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {/* Market News - Spans 2 cols on desktop */}
                    <BentoCard className="lg:col-span-2 min-h-[350px] sm:min-h-[400px]" icon={Zap} title="Market News" delay={0.4}>
                        <div className="w-full mt-4 space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                            {newsLoading ? (
                                <div className="flex items-center justify-center h-[320px]">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
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
                                                    background: 'rgba(255,255,255,0.04)',
                                                    borderRadius: 12,
                                                    padding: '14px 16px',
                                                    border: '1px solid rgba(255,255,255,0.07)',
                                                    display: 'block',
                                                    width: '100%',
                                                    boxSizing: 'border-box',
                                                    textDecoration: 'none',
                                                    transition: 'all 0.2s'
                                                }}
                                                className="hover:bg-white/[0.08] hover:border-white/[0.12] transition-all group"
                                            >
                                                <p style={{
                                                    margin: '0 0 10px',
                                                    fontSize: 'clamp(13px, 3.8vw, 15px)',
                                                    fontWeight: 700,
                                                    lineHeight: 1.5,
                                                    color: '#fff',
                                                    wordBreak: 'break-word',
                                                }}>
                                                    {article.title}
                                                </p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                    <span style={{ 
                                                        background: 'rgba(56,189,248,0.15)', 
                                                        color: '#38bdf8',
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
                                                        color: 'rgba(255,255,255,0.35)',
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
                                        <div key={item.symbol} className="bg-white/[0.02] rounded-xl p-3 sm:p-4 border border-white/[0.04] hover:border-accent/20 transition-all flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <CoinIcon symbol={item.symbol} size={32} />
                                                    <div>
                                                        <h3 className="font-bold text-white text-[13px]">{item.symbol}</h3>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-[10px] text-slate-400 font-mono price-mono">{item.quantity.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                                                            <span className="text-[9px] text-slate-600 uppercase">@</span>
                                                            <span className="text-[10px] text-slate-400 font-mono price-mono">{formatAmount(convert(item.buyPrice), currency)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-white font-mono price-mono text-[13px] block">{formatAmount(convert(item.currentValue), currency)}</span>
                                                    <div className={`font-mono price-mono font-bold text-[10px] flex justify-end gap-1 mt-0.5 ${isProfit ? 'text-success' : 'text-danger'}`}>
                                                        {isProfit ? '+' : ''}{item.pnlPercent.toFixed(1)}%
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Allocation Bar */}
                                            <div className="w-full">
                                                <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-1.5">
                                                    <span className="uppercase tracking-widest">Weight</span>
                                                    <span>{allocation.toFixed(1)}%</span>
                                                </div>
                                                <div className="h-1 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.04]">
                                                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${allocation}%`, backgroundColor: assetColor }} />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 w-full">
                                                <button 
                                                    onClick={() => navigate(`/trade/${item.symbol}`)}
                                                    className="flex-1 px-2 py-1.5 bg-success/[0.1] hover:bg-success/[0.2] text-success rounded-lg font-bold text-[10px] transition-colors border border-success/[0.15]"
                                                >
                                                    Buy
                                                </button>
                                                <button 
                                                    onClick={() => navigate(`/trade/${item.symbol}`)}
                                                    className="flex-1 px-2 py-1.5 bg-danger/[0.1] hover:bg-danger/[0.2] text-danger rounded-lg font-bold text-[10px] transition-colors border border-danger/[0.15]"
                                                >
                                                    Sell
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        const pnlStr = isProfit ? 'up' : 'down';
                                                        const message = `I hold ${item.symbol} and I'm ${pnlStr} ${Math.abs(item.pnlPercent).toFixed(1)}%. Should I take profits or hold?`;
                                                        window.dispatchEvent(new CustomEvent('open-crypto-chat', { detail: { message } }));
                                                    }}
                                                    className="px-2 py-1.5 bg-sky-500/[0.1] hover:bg-sky-500/[0.2] text-sky-400 rounded-lg font-bold text-[10px] transition-colors border border-sky-500/[0.2] flex items-center justify-center"
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
                            <Link to="/markets" className="text-[12px] text-accent hover:text-white transition-colors font-bold uppercase tracking-widest flex items-center gap-1.5">
                                View All <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                        <table className="w-full min-w-[500px] sm:min-w-0">
                            <thead>
                                <tr className="border-b border-white/[0.06]">
                                    <th className="text-left py-3 px-3 th-label">Asset</th>
                                    <th className="text-right py-3 px-3 th-label">Price</th>
                                    <th className="text-right py-3 px-3 th-label hidden sm:table-cell">24h Change</th>
                                    <th className="text-right py-3 px-3 th-label">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4" className="py-12 text-center text-slate-500 text-sm">Synchronizing real-time data...</td></tr>
                                ) : marketData.map((asset) => (
                                    <tr key={asset.id} className="hover:bg-white/[0.02] transition-colors group border-b border-white/[0.04]">
                                        <td className="py-4 px-3">
                                            <div className="flex items-center gap-3">
                                                <CoinIcon symbol={asset.symbol} size={32} />
                                                <div>
                                                    <p className="font-bold text-[13px] text-white leading-none mb-1">{asset.name}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{asset.symbol}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-right py-4 px-3 font-mono price-mono font-bold text-white text-[13px]">
                                            {formatAmount(convert(asset.price), currency)}
                                        </td>
                                        <td className={`text-right py-4 px-3 font-mono price-mono font-bold text-[12px] hidden sm:table-cell ${asset.change >= 0 ? 'text-success' : 'text-danger'}`}>
                                            <span className="flex items-center justify-end gap-1">
                                                {asset.change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                                {Math.abs(asset.change).toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="text-right py-4 px-3">
                                            <Link to={`/trade/${asset.symbol}`} className="bg-white/[0.04] hover:bg-accent hover:text-black border border-white/[0.08] hover:border-accent px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all inline-block uppercase tracking-wider">
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
