import React, { useState, useMemo, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { Search, Filter, TrendingUp, TrendingDown, ArrowUpRight, Star } from 'lucide-react';
import BentoCard from '../components/ui/BentoCard';
import AssetDrawer from '../components/ui/AssetDrawer';
import FilterPanel from '../components/ui/FilterPanel';
import { useMarket } from '../context/MarketContext';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/LoadingState';
import { formatPrice } from '../utils/formatPrice';
import API_BASE_URL from '../config/api';
import { useCurrency } from '../context/CurrencyContext';
import { formatAmount } from '../utils/formatCurrency';
import CoinIcon from '../components/ui/CoinIcon';

// Format large numbers - these are now only used during data fetch to store formatted strings
// The actual display uses formatAmount(convert(...), currency) for currency-aware formatting

export default function Markets() {
    const { toggleWatchlist, isInWatchlist } = useMarket();
        const { currency, convert } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [marketData, setMarketData] = useState([]);

    const [filters, setFilters] = useState({
        minPrice: 0,
        performance: null, // 'gainers' | 'losers'
        marketCap: null, // 'Large' | 'Mid' | 'Small'
        sortBy: 'marketCapDesc'
    });

    // Fetch market data from API
    useEffect(() => {
        const fetchMarketData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/crypto/market-cap?limit=100`);
                const result = await response.json();

                if (result.success) {
                    const formatted = result.data.map(item => ({
                        id: item.baseAsset.toUpperCase(),
                        name: item.baseAsset,
                        symbol: item.baseAsset,
                        price: item.price,
                        change: item.changePercent,
                        rawVolume: item.volume,
                        rawMarketCap: item.quoteVolume,
                        type: 'Crypto'
                    }));
                    setMarketData(formatted);
                }
            } catch (error) {
                console.error('Failed to fetch market data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMarketData();

        const interval = setInterval(fetchMarketData, 15000);
        return () => clearInterval(interval);
    }, []);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    const filteredData = useMemo(() => {
        let data = [...marketData];

        // 1. Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            data = data.filter(asset =>
                asset.name.toLowerCase().includes(term) ||
                asset.symbol.toLowerCase().includes(term)
            );
        }

        // 2. Filters
        if (filters.minPrice > 0) {
            data = data.filter(asset => asset.price >= filters.minPrice);
        }

        if (filters.performance) {
            data = data.filter(asset =>
                filters.performance === 'gainers' ? asset.change >= 0 : asset.change < 0
            );
        }

        // 3. Sorting
        return [...data].sort((a, b) => {
            switch (filters.sortBy) {
                case 'priceDesc': return b.price - a.price;
                case 'priceAsc': return a.price - b.price;
                case 'volumeDesc': return (b.rawVolume || 0) - (a.rawVolume || 0);
                default:
                    return (b.rawVolume || 0) - (a.rawVolume || 0); // Default to volume desc
            }
        });
    }, [marketData, searchTerm, filters]);

    return (
        <MainLayout>
            <div className="space-y-5">
                <div className="flex flex-col gap-4">
                    <div>
                        <h2 className="text-xl font-extrabold text-white">Crypto Market</h2>
                        <p className="text-[rgba(255,255,255,0.3)] mt-0.5 text-[12px]">Real-time prices and analysis for top cryptocurrencies</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="flex gap-2 flex-1 relative">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.25)] group-focus-within:text-accent transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search Crypto..."
                                    className="w-full bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg pl-9 pr-4 py-2 text-white text-[13px] focus:outline-none focus:border-accent/40 transition-all placeholder:text-[rgba(255,255,255,0.25)]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`bg-white/[0.04] border p-2 rounded-lg transition-all ${isFilterOpen ? 'border-accent/40 text-accent' : 'border-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.3)] hover:text-white hover:border-[rgba(255,255,255,0.12)]'}`}
                            >
                                <Filter size={16} />
                            </button>

                            <FilterPanel
                                isOpen={isFilterOpen}
                                onClose={() => setIsFilterOpen(false)}
                                filters={filters}
                                setFilters={setFilters}
                            />
                        </div>
                    </div>
                </div>

                <BentoCard>
                    {isLoading ? (
                        <TableSkeleton rows={8} />
                    ) : (
                        <>
                            {isMobile ? (
                                <div className="w-full overflow-hidden">
                                    {/* Mobile Header */}
                                    <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 border-b border-white/[0.06] th-label uppercase">
                                        <span>Asset</span>
                                        <span className="text-right">Price</span>
                                        <span className="text-right min-w-[60px]">Change</span>
                                    </div>
                                    <div className="divide-y divide-white/[0.04]">
                                        {filteredData.map((asset) => (
                                            <div
                                                key={asset.id}
                                                onClick={() => setSelectedAsset(asset)}
                                                className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-4 items-center hover:bg-white/[0.02] cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <CoinIcon symbol={asset.symbol} size={32} />
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-sm text-white truncate">{asset.symbol}</div>
                                                        <div className="text-[10px] text-slate-500 uppercase tracking-widest truncate">{asset.name}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right font-mono price-mono font-bold text-xs">
                                                    {formatAmount(convert(asset.price), currency)}
                                                </div>
                                                <div className={`text-right font-mono price-mono font-bold text-xs min-w-[60px] ${asset.change >= 0 ? 'text-success' : 'text-danger'}`}>
                                                    {asset.change >= 0 ? '↑' : '↓'}{Math.abs(asset.change || 0).toFixed(2)}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto -mx-4 sm:mx-0">
                                    <div className="inline-block min-w-full align-middle">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                                                    <th className="w-8 text-center py-3"></th>
                                                    <th className="text-left py-3 px-3 sm:px-5 th-label">Asset</th>
                                                    <th className="text-right py-3 px-3 sm:px-5 th-label">Price</th>
                                                    <th className="text-right py-3 px-3 sm:px-5 th-label">Change</th>
                                                    <th className="text-right py-3 px-3 sm:px-5 th-label hidden md:table-cell">Market Cap</th>
                                                    <th className="text-right py-3 px-3 sm:px-5 th-label hidden lg:table-cell">Volume</th>
                                                    <th className="text-right py-3 px-3 sm:px-5 th-label">Trade</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredData.map((asset) => (
                                                    <tr
                                                        key={asset.id}
                                                        onClick={() => setSelectedAsset(asset)}
                                                        className="hover:bg-[rgba(56,189,248,0.04)] transition-colors group cursor-pointer border-b border-[rgba(255,255,255,0.04)]"
                                                    >
                                                        <td className="text-center py-3 px-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleWatchlist(asset.id);
                                                                }}
                                                                className={`transition-all hover:scale-110 ${isInWatchlist(asset.id) ? 'text-yellow-400 fill-yellow-400' : 'text-[rgba(255,255,255,0.15)] hover:text-yellow-400'}`}
                                                            >
                                                                <Star size={14} />
                                                            </button>
                                                        </td>
                                                        <td className="py-3 px-3 sm:px-5">
                                                            <div className="flex items-center gap-2.5">
                                                                <CoinIcon symbol={asset.symbol} size={28} />
                                                                <div className="min-w-0">
                                                                    <p className="font-bold text-[13px] text-white truncate">{asset.name}</p>
                                                                    <span className="text-[10px] text-[rgba(255,255,255,0.25)] uppercase tracking-wider">{asset.symbol}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-right py-3 px-3 sm:px-5">
                                                            <span className="font-mono price-mono font-bold text-white">
                                                                {formatAmount(convert(asset.price), currency)}
                                                            </span>
                                                        </td>
                                                        <td className="text-right py-3 px-3 sm:px-5">
                                                            <div className={`inline-flex items-center gap-1 font-mono price-mono font-bold text-[13px] ${asset.change >= 0 ? 'text-success' : 'text-danger'}`}>
                                                                {asset.change >= 0 ? '↑' : '↓'}
                                                                {Math.abs(asset.change || 0).toFixed(2)}%
                                                            </div>
                                                        </td>
                                                        <td className="text-right py-3 px-3 sm:px-5 text-[rgba(255,255,255,0.4)] font-mono price-mono text-[12px] hidden md:table-cell">
                                                            {asset.rawMarketCap ? formatAmount(convert(asset.rawMarketCap), currency) : 'N/A'}
                                                        </td>
                                                        <td className="text-right py-3 px-3 sm:px-5 text-[rgba(255,255,255,0.4)] font-mono price-mono text-[12px] hidden lg:table-cell">
                                                            {asset.rawVolume ? formatAmount(convert(asset.rawVolume), currency) : 'N/A'}
                                                        </td>
                                                        <td className="text-right py-3 px-3 sm:px-5">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedAsset(asset);
                                                                }}
                                                                className="bg-accent/[0.1] hover:bg-accent/[0.2] text-accent border border-accent/[0.25] px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                                                            >
                                                                Trade <ArrowUpRight size={12} className="ml-0.5 inline" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {filteredData.length === 0 && (
                                <EmptyState
                                    title="No assets found"
                                    description="Try adjusting your filters or search query"
                                    action={
                                        <button
                                            onClick={() => {
                                                setSearchTerm('');
                                                setFilters({ minPrice: 0, performance: null, marketCap: null, sortBy: 'marketCapDesc' });
                                            }}
                                            className="text-accent text-sm font-bold hover:text-white"
                                        >
                                            Clear all filters
                                        </button>
                                    }
                                />
                            )}
                        </>
                    )}
                </BentoCard>
            </div>

            <AssetDrawer
                isOpen={!!selectedAsset}
                onClose={() => setSelectedAsset(null)}
                asset={selectedAsset}
                isInWatchlist={selectedAsset ? isInWatchlist(selectedAsset.id) : false}
                onToggleWatchlist={toggleWatchlist}
            />
        </MainLayout>
    );
}
