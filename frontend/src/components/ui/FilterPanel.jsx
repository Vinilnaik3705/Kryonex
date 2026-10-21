import React from 'react';
import { X } from 'lucide-react';

export default function FilterPanel({
    isOpen,
    onClose,
    filters,
    setFilters
}) {
    if (!isOpen) return null;

    const handlePriceChange = (e) => {
        setFilters({ ...filters, minPrice: Number(e.target.value) });
    };

    const toggleFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: prev[key] === value ? null : value }));
    };

    return (
        <div className="absolute right-0 top-12 w-80 glass-card rounded-xl shadow-card-hover z-20 p-6 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-text-main">Advanced Filters</h3>
                <button onClick={onClose} className="text-text-dim hover:text-text-main transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="space-y-6">
                {/* Price Range */}
                <div>
                    <div className="flex justify-between text-xs text-text-muted mb-2">
                        <span>Min Price</span>
                        <span>${filters.minPrice}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100000"
                        step="100"
                        value={filters.minPrice}
                        onChange={handlePriceChange}
                        className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                </div>

                {/* Performance */}
                <div>
                    <label className="text-xs font-bold text-text-dim uppercase tracking-wider mb-3 block">Performance (24h)</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => toggleFilter('performance', 'gainers')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${filters.performance === 'gainers' ? 'bg-success/10 border-success text-success' : 'border-border text-text-muted hover:border-brand-200'}`}
                        >
                            Gainers
                        </button>
                        <button
                            onClick={() => toggleFilter('performance', 'losers')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${filters.performance === 'losers' ? 'bg-danger/10 border-danger text-danger' : 'border-border text-text-muted hover:border-brand-200'}`}
                        >
                            Losers
                        </button>
                    </div>
                </div>

                {/* Market Cap */}
                <div>
                    <label className="text-xs font-bold text-text-dim uppercase tracking-wider mb-3 block">Market Cap</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['Large', 'Mid', 'Small'].map(cap => (
                            <button
                                key={cap}
                                onClick={() => toggleFilter('marketCap', cap)}
                                className={`py-2 rounded-lg text-xs font-bold border transition-all ${filters.marketCap === cap ? 'bg-brand-50 border-brand-300 text-brand-700' : 'border-border text-text-muted hover:border-brand-200'}`}
                            >
                                {cap}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sort By */}
                <div>
                    <label className="text-xs font-bold text-text-dim uppercase tracking-wider mb-3 block">Sort By</label>
                    <select
                        value={filters.sortBy}
                        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-accent"
                    >
                        <option value="marketCapDesc">Market Cap (High to Low)</option>
                        <option value="volumeDesc">Volume (High to Low)</option>
                        <option value="priceDesc">Price (High to Low)</option>
                        <option value="priceAsc">Price (Low to High)</option>
                    </select>
                </div>

                <button
                    onClick={() => setFilters({ minPrice: 0, performance: null, marketCap: null, sortBy: 'marketCapDesc' })}
                    className="w-full py-2 text-xs font-bold text-text-dim hover:text-brand-600 transition-colors"
                >
                    Reset Filters
                </button>
            </div>
        </div>
    );
}
