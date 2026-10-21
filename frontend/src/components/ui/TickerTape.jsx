import React from 'react';

/**
 * TickerTape — infinite horizontal marquee of crypto pairs.
 * Pure CSS animation (animate-marquee), GPU-friendly, accessibility-friendly via aria-hidden.
 * `items` = [{ symbol, price, change }]
 */
const DEFAULT_ITEMS = [
    { symbol: 'BTC', price: '64,231.50', change: 2.4, up: true },
    { symbol: 'ETH', price: '3,452.10', change: 1.8, up: true },
    { symbol: 'SOL', price: '142.30', change: -1.2, up: false },
    { symbol: 'BNB', price: '582.40', change: 0.6, up: true },
    { symbol: 'XRP', price: '0.5210', change: 3.1, up: true },
    { symbol: 'ADA', price: '0.4521', change: -0.8, up: false },
    { symbol: 'DOGE', price: '0.1320', change: 4.2, up: true },
    { symbol: 'AVAX', price: '34.20', change: -2.1, up: false },
    { symbol: 'DOT', price: '6.84', change: 1.1, up: true },
    { symbol: 'LINK', price: '14.52', change: 0.4, up: true },
    { symbol: 'MATIC', price: '0.7820', change: -1.6, up: false },
    { symbol: 'ATOM', price: '8.21', change: 2.7, up: true },
];

export default function TickerTape({ items = DEFAULT_ITEMS, speed = 'normal' }) {
    const durationClass = speed === 'fast' ? '[animation-duration:25s]' : speed === 'slow' ? '[animation-duration:60s]' : '[animation-duration:40s]';

    const Row = () => (
        <div className="flex items-center gap-8 px-4 shrink-0">
            {items.map((it, i) => (
                <div key={`${it.symbol}-${i}`} className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-xs font-bold text-text-main font-heading tracking-tight">{it.symbol}</span>
                    <span className="text-xs price-mono text-text-muted">${it.price}</span>
                    <span className={`text-xs font-semibold price-mono ${it.up ? 'text-success' : 'text-danger'}`}>
                        {it.up ? '▲' : '▼'} {Math.abs(it.change).toFixed(2)}%
                    </span>
                    <span className="text-border ml-4">•</span>
                </div>
            ))}
        </div>
    );

    return (
        <div
            className="relative w-full overflow-hidden border-y border-border bg-secondary/50 py-2.5"
            aria-hidden="true"
        >
            {/* Edge fades */}
            <div className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, var(--color-primary), transparent)' }} />
            <div className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, var(--color-primary), transparent)' }} />

            <div className={`flex w-max animate-marquee ${durationClass}`}>
                <Row />
                <Row />
            </div>
        </div>
    );
}
