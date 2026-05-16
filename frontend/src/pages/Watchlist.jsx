import React, { useState, useMemo, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { Search, TrendingUp, TrendingDown, ArrowUpRight, Star } from 'lucide-react';
import BentoCard from '../components/ui/BentoCard';
import AssetDrawer from '../components/ui/AssetDrawer';
import { useMarket } from '../context/MarketContext';
import { Link } from 'react-router-dom';
import EmptyState from '../components/ui/EmptyState';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { formatPrice } from '../utils/formatPrice';
import { useCurrency } from '../context/CurrencyContext';
import { formatAmount } from '../utils/formatCurrency';
import CoinIcon from '../components/ui/CoinIcon';

const API_URL = `${API_BASE_URL}`;

export default function Watchlist() {
    const { toggleWatchlist, isInWatchlist, watchlist } = useMarket();
        const { currency, convert } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch assets from API
    useEffect(() => {
        const fetchAssets = async () => {
            setLoading(true);
            try {
                const endpoint = `${API_URL}/crypto/market-cap?limit=100`;
                const response = await axios.get(endpoint);

                if (response.data.success || response.data.data) {
                    const data = response.data.data || response.data;
                    const formatted = data.map(item => {
                        const assetId = (item.baseAsset || item.symbol || '').toUpperCase();
                        // Be defensive about different API shapes (lastPrice, price, close, etc.)
                        const rawPrice = item.price ?? item.lastPrice ?? item.close ?? item.last?.price ?? item.p ?? null;
                        const parsedPrice = Number.parseFloat(rawPrice);

                        const rawChange = item.changePercent ?? item.priceChangePercent ?? item.priceChange ?? item.priceChangePercent ?? item.change ?? 0;
                        const parsedChange = Number.parseFloat(rawChange);

                        return {
                            id: assetId,
                            name: item.name || item.baseAsset || assetId,
                            symbol: assetId,
                            price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
                            change: Number.isFinite(parsedChange) ? parsedChange : 0,
                            marketCap: item.marketCap ?? item.quoteVolume ?? 'N/A',
                            volume: item.volume ?? item.quoteVolume ?? 'N/A'
                        };
                    });
                    setAssets(formatted);
                }
            } catch (error) {
                console.error('Failed to fetch watchlist assets:', error);
                setAssets([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAssets();
    }, []);

    const filteredData = useMemo(() => {
        // Filter by watchlist
        let data = assets.filter(asset => isInWatchlist(asset.id));

        // Then filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            data = data.filter(asset =>
                asset.name.toLowerCase().includes(term) ||
                asset.symbol.toLowerCase().includes(term)
            );
        }

        return data;
    }, [searchTerm, isInWatchlist, assets]);

    return (
        <MainLayout>
            <div className="space-y-5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                        <h2 className="text-xl font-extrabold text-white">My Watchlist</h2>
                        <p className="text-[rgba(255,255,255,0.3)] mt-0.5 text-[12px]">Track your favorite assets</p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-56 group max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.25)] group-focus-within:text-accent transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search watchlist..."
                                className="w-full bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg pl-9 pr-4 py-2 text-white text-[13px] focus:outline-none focus:border-accent/40 transition-all placeholder:text-[rgba(255,255,255,0.25)]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <BentoCard>
                    <div className="hidden sm:block overflow-x-auto min-h-[400px]">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                                    <th className="w-8 text-center py-3"></th>
                                    <th className="text-left py-3 px-3 sm:px-5 th-label">Asset</th>
                                    <th className="text-right py-3 px-3 sm:px-5 th-label">Price</th>
                                    <th className="text-right py-3 px-3 sm:px-5 th-label">Change</th>
                                    <th className="text-right py-3 px-5 th-label hidden lg:table-cell">Market Cap</th>
                                    <th className="text-right py-3 px-5 th-label hidden xl:table-cell">Volume</th>
                                    <th className="text-right py-3 px-3 sm:px-5 th-label hidden sm:table-cell">Trade</th>
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
                                                className="text-yellow-400 fill-yellow-400 transition-all hover:scale-110"
                                            >
                                                <Star size={14} />
                                            </button>
                                        </td>
                                        <td className="py-3 px-3 sm:px-5">
                                            <div className="flex items-center gap-2.5">
                                                <CoinIcon symbol={asset.symbol} size={28} />
                                                <div className="min-w-0">
                                                    <p className="font-bold text-[13px] text-white truncate max-w-[80px] sm:max-w-none">{asset.name}</p>
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
                                                {Math.abs(asset.change).toFixed(2)}%
                                            </div>
                                        </td>
                                        <td className="text-right py-3 px-5 text-[rgba(255,255,255,0.4)] font-mono price-mono text-[12px] hidden lg:table-cell">
                                            {asset.marketCap && asset.marketCap !== 'N/A' ? formatAmount(convert(Number(asset.marketCap)), currency) : 'N/A'}
                                        </td>
                                        <td className="text-right py-3 px-5 text-[rgba(255,255,255,0.4)] font-mono price-mono text-[12px] hidden xl:table-cell">
                                            {asset.volume && asset.volume !== 'N/A' ? formatAmount(convert(Number(asset.volume)), currency) : 'N/A'}
                                        </td>
                                        <td className="text-right py-3 px-3 sm:px-5 hidden sm:table-cell">
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
                    <div className="sm:hidden min-h-[400px] space-y-3 p-3">
                        {filteredData.map((asset) => (
                            <div
                                key={asset.id}
                                onClick={() => setSelectedAsset(asset)}
                                className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] active:bg-[rgba(56,189,248,0.05)] transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleWatchlist(asset.id);
                                        }}
                                        className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-yellow-400/20 bg-yellow-400/10 text-yellow-400 active:scale-95 transition-transform shrink-0"
                                        aria-label={`Toggle ${asset.symbol} watchlist`}
                                    >
                                        <Star size={18} fill="currentColor" />
                                    </button>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2.5">
                                            <CoinIcon symbol={asset.symbol} size={30} />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-[14px] text-white truncate">{asset.name}</p>
                                                <span className="text-[10px] text-[rgba(255,255,255,0.25)] uppercase tracking-wider">{asset.symbol}</span>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-end justify-between gap-3">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-[rgba(255,255,255,0.35)]">Price</p>
                                                <p className="mt-1 font-mono price-mono text-[17px] font-bold text-white">
                                                    {formatAmount(convert(asset.price), currency)}
                                                </p>
                                            </div>

                                            <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold font-mono price-mono ${asset.change >= 0 ? 'bg-success/[0.15] text-success' : 'bg-danger/[0.15] text-danger'}`}>
                                                {asset.change >= 0 ? '↑' : '↓'}
                                                {Math.abs(asset.change).toFixed(2)}%
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedAsset(asset);
                                                }}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-accent/[0.25] bg-accent/[0.12] px-3 py-2 text-[11px] font-bold text-accent"
                                            >
                                                Trade <ArrowUpRight size={12} />
                                            </button>
                                            <span className="text-[10px] text-[rgba(255,255,255,0.25)]">Tap card for details</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredData.length === 0 && (
                            <EmptyState
                                icon={Star}
                                title="Your watchlist is empty"
                                description="Star assets in the Markets page to see them here"
                                action={
                                    <Link to="/markets" className="text-accent underline hover:text-white">
                                        Go to Markets
                                    </Link>
                                }
                            />
                        )}
                    </div>
                    <div className="hidden sm:block">
                        {filteredData.length === 0 && (
                        <EmptyState
                            icon={Star}
                            title="Your watchlist is empty"
                            description="Star assets in the Markets page to see them here"
                            action={
                                <Link to="/markets" className="text-accent underline hover:text-white">
                                    Go to Markets
                                </Link>
                            }
                        />
                        )}
                    </div>
                </BentoCard>
            </div>

            {/* Reuse Asset Drawer */}
            <AssetDrawer
                isOpen={!!selectedAsset}
                onClose={() => setSelectedAsset(null)}
                asset={selectedAsset}
            />
        </MainLayout>
    );
}
