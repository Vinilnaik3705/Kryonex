import React from 'react';
import { useMarket } from '../../context/MarketContext';

const MarketToggle = ({ className = '' }) => {
    useMarket();

    return (
        <div className={`bg-slate-900/50 px-4 py-2 rounded-lg flex items-center gap-2 border border-slate-800 text-xs font-bold text-white ${className}`}>
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            Crypto Only
        </div>
    );
};

export default MarketToggle;
