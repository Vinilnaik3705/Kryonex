import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Briefcase, TrendingUp, Wallet, ArrowUpRight, TrendingDown, Activity } from 'lucide-react';
import BentoCard from '../components/ui/BentoCard';
import useWalletAndPortfolio from '../hooks/useWalletAndPortfolio';
import { formatPrice } from '../utils/formatPrice';
import { useCurrency } from '../context/CurrencyContext';
import { formatAmount } from '../utils/formatCurrency';
import CoinIcon from '../components/ui/CoinIcon';

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
    return ASSET_COLORS[symbol.toUpperCase()] || `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
};

export default function Portfolio() {
    const { getHoldingsWithValues, calculatePortfolioValue, calculateTotalPnL } = useWalletAndPortfolio();
    const { currency, convert } = useCurrency();
    const [updateTrigger, setUpdateTrigger] = useState(0);
    const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    // Force re-render when live prices change
    useEffect(() => {
        const interval = setInterval(() => {
            setUpdateTrigger(prev => prev + 1);
            setLastUpdateTime(Date.now());
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const allHoldings = getHoldingsWithValues();
    const filteredHoldings = allHoldings.filter(item => item.type === 'crypto');
    const totalValue = calculatePortfolioValue();
    const totalPnL = calculateTotalPnL();
    const totalPnLPercent = totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;

    const pieData = filteredHoldings.map(item => ({
        name: item.symbol,
        value: item.currentValue,
        color: getAssetColor(item.symbol)
    }));

    const getTimeSinceUpdate = () => {
        const now = Date.now();
        const diff = Math.floor((now - lastUpdateTime) / 1000);
        if (diff < 5) return 'Just now';
        if (diff < 60) return `${diff}s ago`;
        return `${Math.floor(diff / 60)}m ago`;
    };

    return (
        <MainLayout>
            <div className="space-y-5 pb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white">Portfolio</h2>
                    <p className="text-[rgba(255,255,255,0.3)] mt-0.5 text-[11px] sm:text-sm">Live holdings and real-time performance tracking</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Summary Card */}
                    <div className="lg:col-span-1 bg-[#050d14] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 sm:p-6 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/[0.15] rounded-full blur-[60px] -mr-10 -mt-10" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 rounded-lg bg-accent/[0.08] text-accent border border-accent/[0.15]">
                                    <Wallet size={16} />
                                </div>
                                <span className="th-label text-[10px]">Total Balance</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold font-mono price-mono text-white tracking-tight">
                                {formatAmount(convert(totalValue), currency)}
                            </h1>
                            <div className="mt-4 flex items-center gap-2.5">
                                <span className={`flex items-center ${totalPnL >= 0 ? 'text-success bg-success/[0.12]' : 'text-danger bg-danger/[0.12]'} px-2.5 py-1 rounded-lg text-[12px] sm:text-[13px] font-mono price-mono font-bold`}>
                                    {totalPnL >= 0 ? <ArrowUpRight size={14} className="mr-0.5" /> : <TrendingDown size={14} className="mr-0.5" />}
                                    {totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
                                </span>
                                <span className="text-[11px] text-[rgba(255,255,255,0.3)] font-medium">Unrealized P/L</span>
                            </div>
                        </div>
                    </div>

                    {/* Distribution Chart */}
                    <BentoCard className="lg:col-span-2" title="Asset Allocation" icon={Briefcase}>
                        <div className="flex flex-wrap items-center gap-3 mb-4 opacity-60">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-success">Live</span>
                            </div>
                            <span className="text-[10px] text-[rgba(255,255,255,0.4)]">Synced {getTimeSinceUpdate()}</span>
                        </div>

                        {filteredHoldings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Activity size={32} className="text-white/10 mb-3" />
                                <p className="text-[13px] text-slate-400">No active holdings found.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col lg:flex-row items-center gap-8">
                                {/* DONUT CHART CONTAINER */}
                                <div className="relative flex items-center justify-center w-full lg:w-auto">
                                    <div style={{ width: isMobile ? 'min(60vw, 220px)' : 240, height: isMobile ? 'min(60vw, 220px)' : 240 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart key={`chart-${updateTrigger}`}>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={isMobile ? "65%" : 75}
                                                    outerRadius={isMobile ? "90%" : 100}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#050d14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px' }}
                                                    formatter={(value) => formatAmount(convert(value), currency)}
                                                    itemStyle={{ color: 'white', fontFamily: 'JetBrains Mono', fontWeight: 'bold' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                        <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Value</span>
                                        <span className="text-sm sm:text-base font-bold font-mono price-mono text-white">
                                            {formatAmount(convert(totalValue), currency)}
                                        </span>
                                    </div>
                                </div>

                                {/* CARDS GRID */}
                                <div className="w-full flex-1">
                                    <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                        {filteredHoldings.sort((a,b) => b.currentValue - a.currentValue).map((item) => {
                                            const allocation = totalValue > 0 ? ((item.currentValue / totalValue) * 100).toFixed(1) : 0;
                                            return (
                                                <div key={`${item.symbol}-${updateTrigger}`} className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04] hover:border-accent/20 transition-all group">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getAssetColor(item.symbol) }} />
                                                            <span className="text-[12px] font-black text-white">{item.symbol}</span>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-accent">{allocation}%</span>
                                                    </div>
                                                    <p className="font-bold font-mono price-mono text-[12px] text-white">
                                                        {formatAmount(convert(item.currentValue), currency)}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 mt-1 truncate">
                                                        {item.quantity.toLocaleString('en-US', { maximumFractionDigits: 4 })} {item.symbol}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </BentoCard>
                </div>

                {/* Holdings Section */}
                <BentoCard icon={Briefcase} title="Your Holdings">
                    {filteredHoldings.length === 0 ? (
                        <div className="text-center py-10 opacity-30 text-sm">
                            No holdings in portfolio.
                        </div>
                    ) : isMobile ? (
                        // MOBILE CARD VIEW
                        <div className="space-y-3">
                            {filteredHoldings.map((h, idx) => (
                                <div key={idx} className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06] hover:border-accent/20 transition-colors">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <CoinIcon symbol={h.symbol} size={32} />
                                            <div>
                                                <span className="font-bold text-white text-base">{h.symbol}</span>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">{h.quantity.toLocaleString()} UNITS</p>
                                            </div>
                                        </div>
                                        <div className={`text-right ${h.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                                            <p className="font-bold font-mono text-sm">{h.pnl >= 0 ? '+' : ''}{formatAmount(convert(h.pnl), currency)}</p>
                                            <p className="text-[10px] font-bold opacity-80">{h.pnlPercent >= 0 ? '+' : ''}{h.pnlPercent.toFixed(2)}%</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5">
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Buy Price</p>
                                            <p className="font-mono text-xs text-white/70">{formatAmount(convert(h.buyPrice), currency)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current</p>
                                            <p className="font-mono text-xs text-white/70">{formatAmount(convert(h.currentPrice), currency)}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Market Value</p>
                                            <p className="font-mono text-sm text-white font-bold">{formatAmount(convert(h.currentValue), currency)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // DESKTOP TABLE VIEW
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/[0.06]">
                                        <th className="text-left py-3 px-3 th-label">Asset</th>
                                        <th className="text-right py-3 px-3 th-label">Quantity</th>
                                        <th className="text-right py-3 px-3 th-label">Buy Price</th>
                                        <th className="text-right py-3 px-3 th-label">Current Price</th>
                                        <th className="text-right py-3 px-3 th-label">Current Value</th>
                                        <th className="text-right py-3 px-3 th-label">P/L</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHoldings.map((item, idx) => (
                                        <PortfolioRow key={idx} item={item} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </BentoCard>
            </div>
        </MainLayout>
    );
}

const PortfolioRow = ({ item }) => {
    const [expanded, setExpanded] = React.useState(false);
    const { currency, convert } = useCurrency();

    return (
        <>
            <tr
                onClick={() => setExpanded(!expanded)}
                className={`transition-colors cursor-pointer border-b border-white/[0.04] ${expanded ? 'bg-accent/[0.04]' : 'hover:bg-white/[0.02]'}`}
            >
                <td className="py-4 px-3">
                    <div className="flex items-center gap-3">
                        <CoinIcon symbol={item.symbol} size={28} />
                        <div>
                            <span className="font-bold text-[14px] text-white block leading-none mb-1">{item.symbol}</span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Holdings</span>
                        </div>
                    </div>
                </td>
                <td className="text-right py-4 px-3 text-white text-[13px] font-mono price-mono">
                    {item.quantity.toLocaleString('en-US', { maximumFractionDigits: 6 })}
                </td>
                <td className="text-right py-4 px-3 text-slate-400 text-[13px] font-mono price-mono">
                    {formatAmount(convert(item.buyPrice), currency)}
                </td>
                <td className="text-right py-4 px-3 text-slate-400 text-[13px] font-mono price-mono">
                    {formatAmount(convert(item.currentPrice), currency)}
                </td>
                <td className="text-right py-4 px-3 font-bold text-[14px] text-white font-mono price-mono">
                    {formatAmount(convert(item.currentValue), currency)}
                </td>
                <td className={`text-right py-4 px-3 ${item.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                    <div className="flex flex-col items-end">
                        <span className="font-bold font-mono price-mono text-[13px]">{item.pnl >= 0 ? '+' : ''}{formatAmount(convert(item.pnl), currency)}</span>
                        <span className={`text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded ${item.pnlPercent >= 0 ? 'bg-success/[0.1]' : 'bg-danger/[0.1]'}`}>
                            {item.pnlPercent >= 0 ? '+' : ''}{item.pnlPercent.toFixed(2)}%
                        </span>
                    </div>
                </td>
            </tr>
            {expanded && item.trades && item.trades.length > 0 && (
                <tr className="bg-black/40">
                    <td colSpan={6} className="py-4 px-3">
                        <div className="bg-[#050d14] rounded-xl p-4 border border-white/[0.06] shadow-inner">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Recent Trade History</h4>
                            <div className="space-y-2.5">
                                {item.trades.map((trade, idx) => (
                                    <div key={idx} className="flex justify-between text-[11px] items-center border-b border-white/[0.03] pb-2 last:border-0 last:pb-0">
                                        <span className={`font-black uppercase ${trade.type === 'buy' ? 'text-success' : 'text-danger'}`}>
                                            {trade.type}
                                        </span>
                                        <span className="text-white/80 font-mono">
                                            {trade.quantity.toLocaleString()} units @ {formatAmount(convert(trade.price), currency)}
                                        </span>
                                        <span className="text-slate-600 font-medium">
                                            {new Date(trade.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};
