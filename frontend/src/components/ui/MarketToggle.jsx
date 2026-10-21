import React from 'react';
import { useMarket } from '../../context/MarketContext';

const MarketToggle = ({ className = '' }) => {
    useMarket();

    return (
        <div className={`bg-brand-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-brand-100 text-xs font-bold text-brand-700 ${className}`}>
            <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            Crypto Only
        </div>
    );
};

export default MarketToggle;
