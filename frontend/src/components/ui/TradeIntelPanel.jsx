import React, { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, BadgeDollarSign, BarChart3, Clock3, Flame, ShieldCheck } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';
import { useCurrency } from '../../context/CurrencyContext';
import { formatAmount } from '../../utils/formatCurrency';

const formatCompactNumber = (value, currency, convert) => {
    const amount = Number(value) || 0;
    return formatAmount(convert(amount), currency);
};

const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';

    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
};

const getMood = (changePercent) => {
    const change = Number(changePercent) || 0;

    if (change > 2) {
        return { label: 'Bullish', value: Math.min(96, 62 + change * 6), tone: 'text-success', bar: 'from-success to-accent', hint: `${Math.min(96, 62 + change * 6)}% Bullish` };
    }

    if (change >= 0) {
        return { label: 'Neutral', value: 50 + change * 8, tone: 'text-accent', bar: 'from-accent to-sky-300', hint: 'Neutral pressure' };
    }

    return { label: 'Bearish', value: Math.max(8, 50 + change * 8), tone: 'text-danger', bar: 'from-danger to-rose-400', hint: 'Bearish pressure' };
};

export default function TradeIntelPanel({
    symbol,
    currentPrice,
    assetStats,
    recentTrades = [],
    walletBalance,
    onSubmitTrade,
    isSubmitting = false,
    errorMessage = '',
}) {
    const [side, setSide] = useState('buy');
    const [amount, setAmount] = useState('');
    const { currency, convert } = useCurrency();

    const amountNumber = Number.parseFloat(amount);
    const estimateQuantity = Number.isFinite(amountNumber) && Number(currentPrice) > 0 ? amountNumber / Number(currentPrice) : 0;
    const mood = useMemo(() => getMood(assetStats?.changePercent), [assetStats?.changePercent]);
    const canSubmit = Number.isFinite(amountNumber) && amountNumber > 0 && Number(currentPrice) > 0;

    const submitTrade = () => {
        if (!canSubmit || isSubmitting) return;
        onSubmitTrade?.(side, amountNumber);
    };

    const priceLabel = side === 'buy' ? `Buy ${symbol}` : `Sell ${symbol}`;

    return (
        <div className="flex h-full flex-col gap-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#050d14] p-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-2.5">
                <div>
                    <p className="th-label text-accent">Trade Intelligence</p>
                    <h3 className="mt-0.5 text-lg font-extrabold text-white">{symbol}</h3>
                </div>
            </div>

            {/* Quick Trade */}
            <section className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-white/[0.02] p-3">
                <div className="mb-2.5 flex items-center gap-2 text-[12px] font-bold text-white">
                    <BadgeDollarSign size={14} className="text-accent" /> Quick Trade
                </div>

                {/* Buy/Sell Toggle */}
                <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#050d14] p-1">
                    <button
                        onClick={() => setSide('buy')}
                        className={`rounded-lg px-3 py-2 text-[12px] font-bold transition-all ${side === 'buy'
                            ? 'bg-[rgba(34,211,160,0.15)] text-success shadow-[0_0_12px_rgba(34,211,160,0.15)]'
                            : 'text-[rgba(255,255,255,0.3)] hover:text-white'
                            }`}
                    >
                        Buy
                    </button>
                    <button
                        onClick={() => setSide('sell')}
                        className={`rounded-lg px-3 py-2 text-[12px] font-bold transition-all ${side === 'sell'
                            ? 'bg-[rgba(244,63,94,0.12)] text-danger shadow-[0_0_12px_rgba(244,63,94,0.12)]'
                            : 'text-[rgba(255,255,255,0.3)] hover:text-white'
                            }`}
                    >
                        Sell
                    </button>
                </div>

                {/* Amount Input */}
                <label className="mt-3 block th-label">Amount in USDT</label>
                <div className="mt-1.5 relative">
                    <input
                        type="number"
                        inputMode="decimal"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        placeholder="Enter amount"
                        className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-white/[0.04] px-3 py-2.5 pr-14 font-mono price-mono text-white text-[13px] outline-none transition-colors placeholder:text-[rgba(255,255,255,0.2)] focus:border-accent/40"
                    />
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[rgba(255,255,255,0.25)] tracking-wider">
                        USDT
                    </div>
                </div>

                {/* Estimate */}
                <div className="mt-2.5 rounded-lg border border-[rgba(255,255,255,0.06)] bg-white/[0.02] px-3 py-2.5">
                    <div className="flex items-center justify-between text-[12px]">
                        <span className="text-[rgba(255,255,255,0.35)]">Estimated</span>
                        <span className="font-mono price-mono font-bold text-white">≈ {estimateQuantity > 0 ? estimateQuantity.toLocaleString('en-US', { maximumFractionDigits: 6 }) : '0'} {symbol}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                        <span className="text-[rgba(255,255,255,0.2)]">Wallet</span>
                        <span className="font-mono price-mono text-[rgba(255,255,255,0.4)]">{formatAmount(convert(walletBalance), currency)}</span>
                    </div>
                </div>

                {/* Submit Button — Gradient */}
                <button
                    onClick={submitTrade}
                    disabled={!canSubmit || isSubmitting}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-extrabold transition-all active:scale-[0.99]
                        bg-gradient-to-r from-success to-accent text-black
                        hover:shadow-[0_0_20px_rgba(34,211,160,0.3)]
                        disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none"
                >
                    {side === 'buy' ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                    {priceLabel}
                </button>

                {errorMessage && (
                    <div className="mt-2.5 rounded-lg border border-danger/20 bg-danger/[0.08] px-3 py-2 text-[12px] text-danger">
                        {errorMessage}
                    </div>
                )}
            </section>

            {/* Market Mood */}
            <section className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-white/[0.02] p-3">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-bold text-white">
                    <Flame size={14} className={mood.tone} /> Market Mood
                </div>
                <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.2)]">
                    <span>Bearish</span>
                    <span>Neutral</span>
                    <span>Bullish</span>
                </div>
                <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-white/[0.04]">
                    <div
                        className={`h-full rounded-full bg-gradient-to-r ${mood.bar} transition-all`}
                        style={{ width: `${Math.max(8, Math.min(100, mood.value))}%` }}
                    />
                </div>
                <div className="mt-2 flex items-center justify-between text-[12px]">
                    <span className={`font-bold ${mood.tone}`}>{mood.hint}</span>
                    <span className="font-mono price-mono text-[rgba(255,255,255,0.35)]">{Math.round(Math.max(8, Math.min(100, mood.value)))}%</span>
                </div>
            </section>

            {/* Key Stats */}
            <section className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-white/[0.02] p-3">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-bold text-white">
                    <BarChart3 size={14} className="text-accent" /> Key Stats
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <StatCard label="24h High" value={formatAmount(convert(assetStats?.high), currency)} />
                    <StatCard label="24h Low" value={formatAmount(convert(assetStats?.low), currency)} />
                    <StatCard label="Volume" value={formatCompactNumber(assetStats?.volume, currency, convert)} />
                    <StatCard label="Market Cap" value={formatCompactNumber(assetStats?.marketCap, currency, convert)} />
                </div>
            </section>

            {/* My Activity */}
            <section className="min-h-0 flex-1 rounded-xl border border-[rgba(255,255,255,0.06)] bg-white/[0.02] p-3 overflow-hidden flex flex-col">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-bold text-white">
                    <Clock3 size={14} className="text-accent" /> My Activity
                </div>
                <div className="space-y-1.5 overflow-y-auto pr-1">
                    {recentTrades.length === 0 ? (
                        <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#050d14]/60 px-3 py-3 text-[12px] text-[rgba(255,255,255,0.25)]">
                            No trades yet on {symbol}
                        </div>
                    ) : (
                        recentTrades.slice(0, 4).map((trade, index) => (
                            <div key={`${trade.date}-${index}`} className="flex items-center justify-between rounded-lg border border-[rgba(255,255,255,0.04)] bg-[#050d14]/40 px-3 py-2.5 text-[12px]">
                                <div className="flex items-center gap-2">
                                    <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.15em] ${trade.type === 'sell' ? 'bg-danger/[0.12] text-danger' : 'bg-success/[0.12] text-success'}`}>
                                        {trade.type || 'buy'}
                                    </span>
                                    <span className="font-semibold text-white">{trade.quantity.toLocaleString('en-US', { maximumFractionDigits: 6 })} {symbol}</span>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono price-mono text-[11px] font-bold text-white">{formatAmount(convert(trade.price), currency)}</div>
                                    <div className="text-[10px] text-[rgba(255,255,255,0.2)]">{getTimeAgo(trade.date)}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}

const StatCard = ({ label, value }) => (
    <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#050d14]/50 p-2.5">
        <div className="th-label">{label}</div>
        <div className="mt-1.5 font-mono price-mono text-[13px] font-bold text-white">{value}</div>
    </div>
);
