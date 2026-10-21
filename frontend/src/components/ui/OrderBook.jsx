import React, { useMemo } from 'react';
import { formatPrice } from '../../utils/formatPrice';

const addTotals = (rows) => rows.reduce((acc, row, index) => {
    const total = index === 0 ? row.size : acc[index - 1].total + row.size;
    acc.push({ ...row, total: Number(total.toFixed(4)) });
    return acc;
}, []);

export default function OrderBook({
    asks = [],
    bids = [],
    currentPrice = null,
    symbol = 'BTC',
    recentTrades = [],
}) {
    const asksWithTotal = useMemo(() => addTotals(asks), [asks]);
    const bidsWithTotal = useMemo(() => addTotals(bids), [bids]);

    return (
        <div className="flex flex-col h-full bg-card border border-border rounded-xl p-4 overflow-hidden">
            <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-text-dim uppercase tracking-widest text-[11px]">{symbol} Order Book</span>
                <span className="text-[10px] text-text-dim">Binance Live</span>
            </div>

            <div className="flex justify-between text-xs text-text-dim mb-2 px-1">
                <span>Price (USD)</span>
                <span>Size</span>
                <span>Total</span>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="space-y-0.5 overflow-y-auto pr-1">
                    {[...asksWithTotal].reverse().map((ask, index) => (
                        <div key={`ask-${index}`} className="flex justify-between text-xs py-0.5 text-red-400 hover:bg-red-500/10 px-1 rounded">
                            <span>{formatPrice(ask.price)}</span>
                            <span>{ask.size.toFixed(4)}</span>
                            <span>{ask.total.toFixed(4)}</span>
                        </div>
                    ))}
                </div>

                <div className="text-center text-lg font-bold text-text-main my-2 border-y border-border py-2">
                    {currentPrice ? formatPrice(currentPrice) : '---'}
                </div>

                <div className="space-y-0.5 overflow-y-auto pr-1">
                    {bidsWithTotal.map((bid, index) => (
                        <div key={`bid-${index}`} className="flex justify-between text-xs py-0.5 text-green-400 hover:bg-green-500/10 px-1 rounded">
                            <span>{formatPrice(bid.price)}</span>
                            <span>{bid.size.toFixed(4)}</span>
                            <span>{bid.total.toFixed(4)}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-3 pt-2 border-t border-border">
                <div className="flex justify-between text-[10px] text-text-dim mb-2 uppercase">
                    <span>Recent Trades</span>
                    <span>Time</span>
                </div>
                <div className="space-y-1 max-h-20 overflow-y-auto pr-1">
                    {recentTrades.length === 0 && (
                        <div className="text-[10px] text-text-dim">Waiting for live trades...</div>
                    )}
                    {recentTrades.map((trade, index) => (
                        <div key={`trade-${index}`} className="flex justify-between text-[10px]">
                            <span className={trade.isBuy ? 'text-green-400' : 'text-red-400'}>
                                {trade.size.toFixed(4)} @ {formatPrice(trade.price)}
                            </span>
                            <span className="text-text-dim">{trade.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
