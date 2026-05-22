import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, DollarSign, Activity, BarChart2, ArrowUpRight, Star } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatPrice } from '../../utils/formatPrice';
import { useCurrency } from '../../context/CurrencyContext';
import { formatAmount } from '../../utils/formatCurrency';
import useWalletAndPortfolio from '../../hooks/useWalletAndPortfolio';

// Mock chart data for sparkline
const mockChartData = [
    { time: '10:00', value: 45000 },
    { time: '11:00', value: 45200 },
    { time: '12:00', value: 44800 },
    { time: '13:00', value: 45500 },
    { time: '14:00', value: 46000 },
    { time: '15:00', value: 45800 },
    { time: '16:00', value: 45230 },
];

const AssetDrawer = ({ isOpen, onClose, asset, isInWatchlist = false, onToggleWatchlist }) => {
    const [activeTab, setActiveTab] = useState('buy'); // 'buy' or 'sell'
    const [amount, setAmount] = useState('');
    const { currency, convert } = useCurrency();
    const { walletBalance } = useWalletAndPortfolio();

    if (!asset) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-[#050d14] border-l border-[rgba(255,255,255,0.06)] z-50 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-[rgba(255,255,255,0.06)] flex justify-between items-start bg-[#0a1824]/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-accent/[0.08] flex items-center justify-center font-bold text-lg text-accent border border-accent/[0.15]">
                                    {asset.symbol[0]}
                                </div>
                                <div>
                                    <h2 className="text-xl font-extrabold text-white">{asset.name}</h2>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] uppercase font-bold text-[rgba(255,255,255,0.3)] bg-white/[0.04] px-1.5 py-0.5 rounded tracking-wider">{asset.symbol}</span>
                                        <Link
                                            to={`/trade/${asset.id}`}
                                            state={{ type: asset.type }}
                                            className="text-[11px] font-bold text-accent hover:text-white transition-colors flex items-center gap-0.5"
                                        >
                                            Full Chart <ArrowUpRight size={12} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleWatchlist?.(asset.id);
                                    }}
                                    className={`p-2 rounded-xl transition-colors border ${isInWatchlist ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400' : 'bg-white/[0.03] border-white/[0.06] text-[rgba(255,255,255,0.35)] hover:text-yellow-400 hover:bg-yellow-400/10'}`}
                                    aria-label={isInWatchlist ? 'Remove from wishlist' : 'Add to wishlist'}
                                    title={isInWatchlist ? 'Remove from wishlist' : 'Add to wishlist'}
                                >
                                    <Star size={18} fill={isInWatchlist ? 'currentColor' : 'none'} />
                                </button>
                                <button onClick={onClose} className="p-2 hover:bg-white/[0.06] rounded-xl transition-colors text-[rgba(255,255,255,0.3)] hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">

                            {/* Price & Change */}
                            <div>
                                <h1 className="text-4xl font-extrabold text-white tracking-tight font-mono price-mono">{formatAmount(convert(asset.price), currency)}</h1>
                                <div className={`flex items-center gap-2 mt-3 font-mono price-mono font-bold ${asset.change >= 0 ? 'text-success' : 'text-danger'}`}>
                                    <div className={`p-1 rounded-full ${asset.change >= 0 ? 'bg-success/[0.15]' : 'bg-danger/[0.15]'}`}>
                                        {asset.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                    </div>
                                    <span className="text-lg">{Math.abs(asset.change)}%</span>
                                    <span className="text-[rgba(255,255,255,0.3)] text-sm font-normal ml-1">Past 24h</span>
                                </div>
                            </div>

                            {/* Mini Chart */}
                            <div className="h-[200px] w-full bg-[#0a1824] rounded-xl border border-[rgba(255,255,255,0.06)] p-4 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-accent/[0.02] to-transparent pointer-events-none" />
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={mockChartData}>
                                        <defs>
                                            <linearGradient id="colorValueDrawer" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={asset.change >= 0 ? '#34d399' : '#fb7185'} stopOpacity={0.2} />
                                                <stop offset="95%" stopColor={asset.change >= 0 ? '#34d399' : '#fb7185'} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#050d14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff', fontFamily: 'JetBrains Mono', fontSize: '13px', fontWeight: 'bold' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke={asset.change >= 0 ? '#34d399' : '#fb7185'}
                                            strokeWidth={2}
                                            fill="url(#colorValueDrawer)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Key Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <div className="bg-[#0a1824] p-3 rounded-xl border border-[rgba(255,255,255,0.06)]">
                                    <div className="flex items-center gap-1.5 text-[rgba(255,255,255,0.3)] mb-1">
                                        <Activity size={14} /> <span className="th-label">Volume</span>
                                    </div>
                                    <p className="text-white font-bold font-mono price-mono text-[13px]">{(asset.volume || asset.rawVolume) ? formatAmount(convert(asset.volume || asset.rawVolume), currency) : 'N/A'}</p>
                                </div>
                                <div className="bg-[#0a1824] p-3 rounded-xl border border-[rgba(255,255,255,0.06)]">
                                    <div className="flex items-center gap-1.5 text-[rgba(255,255,255,0.3)] mb-1">
                                        <BarChart2 size={14} /> <span className="th-label">Market Cap</span>
                                    </div>
                                    <p className="text-white font-bold font-mono price-mono text-[13px]">{(asset.marketCap || asset.rawMarketCap) ? formatAmount(convert(asset.marketCap || asset.rawMarketCap), currency) : 'N/A'}</p>
                                </div>
                                <div className="bg-[#0a1824] p-3 rounded-xl border border-[rgba(255,255,255,0.06)]">
                                    <div className="flex items-center gap-1.5 text-[rgba(255,255,255,0.3)] mb-1">
                                        <Activity size={14} /> <span className="th-label">Open</span>
                                    </div>
                                    <p className="text-white font-bold font-mono price-mono text-[13px]">{formatAmount(convert(asset.price * 0.98), currency)}</p>
                                </div>
                                <div className="bg-[#0a1824] p-3 rounded-xl border border-[rgba(255,255,255,0.06)]">
                                    <div className="flex items-center gap-1.5 text-[rgba(255,255,255,0.3)] mb-1">
                                        <TrendingUp size={14} /> <span className="th-label">High</span>
                                    </div>
                                    <p className="text-white font-bold font-mono price-mono text-[13px]">{formatAmount(convert(asset.price * 1.05), currency)}</p>
                                </div>
                                <div className="bg-[#0a1824] p-3 rounded-xl border border-[rgba(255,255,255,0.06)]">
                                    <div className="flex items-center gap-1.5 text-[rgba(255,255,255,0.3)] mb-1">
                                        <TrendingDown size={14} /> <span className="th-label">Low</span>
                                    </div>
                                    <p className="text-white font-bold font-mono price-mono text-[13px]">{formatAmount(convert(asset.price * 0.95), currency)}</p>
                                </div>
                            </div>

                            {/* About Panel */}
                            <div className="bg-[#0a1824] p-5 rounded-xl border border-[rgba(255,255,255,0.06)] shadow-lg">
                                <h3 className="text-[13px] font-extrabold text-white mb-3 flex items-center gap-2">
                                    <Activity size={16} className="text-accent" /> About {asset.name}
                                </h3>
                                <p className="text-[12px] text-[rgba(255,255,255,0.5)] leading-relaxed mb-5">
                                    {asset.name} ({asset.symbol}) is currently trading at <span className="text-white font-bold">{formatAmount(convert(asset.price), currency)}</span> with a 24-hour change of <span className={asset.change >= 0 ? 'text-success font-bold' : 'text-danger font-bold'}>{asset.change >= 0 ? '+' : ''}{asset.change}%</span>.
                                    <br/><br/>
                                    Over the recent years, {asset.symbol} has established itself as a significant asset in the digital economy, showing dynamic performance correlated with broader market trends, adoption rates, and technological developments in the ecosystem.
                                </p>
                                <Link
                                    to={`/trade/${asset.id}`}
                                    state={{ type: asset.type }}
                                    className="w-full flex items-center justify-center gap-2 bg-accent/[0.08] hover:bg-accent/[0.15] text-accent border border-accent/[0.2] py-3.5 rounded-lg font-extrabold text-[13px] transition-all shadow-[0_0_15px_rgba(56,189,248,0.1)]"
                                >
                                    Open Trading Dashboard <ArrowUpRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AssetDrawer;
