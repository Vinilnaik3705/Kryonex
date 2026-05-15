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
        <div className="flex flex-col h-full bg-[#0a0a0a] border border-white/10 rounded-xl p-4 overflow-hidden">
            <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px]">{symbol} Order Book</span>
                <span className="text-[10px] text-slate-500">Binance Live</span>
            </div>

            <div className="flex justify-between text-xs text-slate-500 mb-2 px-1">
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

                <div className="text-center text-lg font-bold text-white my-2 border-y border-white/10 py-2">
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

            <div className="mt-3 pt-2 border-t border-white/10">
                <div className="flex justify-between text-[10px] text-slate-500 mb-2 uppercase">
                    <span>Recent Trades</span>
                    <span>Time</span>
                </div>
                <div className="space-y-1 max-h-20 overflow-y-auto pr-1">
                    {recentTrades.length === 0 && (
                        <div className="text-[10px] text-slate-500">Waiting for live trades...</div>
                    )}
                    {recentTrades.map((trade, index) => (
                        <div key={`trade-${index}`} className="flex justify-between text-[10px]">
                            <span className={trade.isBuy ? 'text-green-400' : 'text-red-400'}>
                                {trade.size.toFixed(4)} @ {formatPrice(trade.price)}
                            </span>
                            <span className="text-slate-500">{trade.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
