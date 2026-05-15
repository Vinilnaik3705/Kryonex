import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { buildUserScopedStorageKey } from '../utils/storage';

const MarketContext = createContext();

export const useMarket = () => useContext(MarketContext);

export const MarketProvider = ({ children }) => {
    const { user } = useAuth();
    const marketType = 'crypto';
    const watchlistStorageKey = buildUserScopedStorageKey('watchlist', user?.id);

    // Watchlist: Set of Asset IDs - Load from localStorage
    const [watchlist, setWatchlist] = useState(new Set());
    const [storageReady, setStorageReady] = useState(false);

    // Alerts: Array of alert objects
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        let isActive = true;

        setStorageReady(false);

        try {
            const saved = localStorage.getItem(watchlistStorageKey);
            const nextWatchlist = saved ? new Set(JSON.parse(saved)) : new Set();

            if (saved === null) {
                localStorage.setItem(watchlistStorageKey, JSON.stringify([]));
            }

            if (isActive) {
                setWatchlist(nextWatchlist);
                setStorageReady(true);
            }
        } catch {
            if (isActive) {
                setWatchlist(new Set());
                setStorageReady(true);
            }
        }

        return () => {
            isActive = false;
        };
    }, [watchlistStorageKey]);

    // Sync watchlist to localStorage whenever it changes
    useEffect(() => {
        if (!storageReady) return;

        try {
            localStorage.setItem(watchlistStorageKey, JSON.stringify(Array.from(watchlist)));
        } catch (error) {
            console.error('Failed to save watchlist:', error);
        }
    }, [watchlist, storageReady, watchlistStorageKey]);

    const toggleMarketType = () => {};

    const addToWatchlist = (assetId) => {
        setWatchlist(prev => {
            const newSet = new Set(prev);
            newSet.add(assetId);
            return newSet;
        });
    };

    const removeFromWatchlist = (assetId) => {
        setWatchlist(prev => {
            const newSet = new Set(prev);
            newSet.delete(assetId);
            return newSet;
        });
    };

    const isInWatchlist = (assetId) => {
        return watchlist.has(assetId);
    };

    const toggleWatchlist = (assetId) => {
        if (isInWatchlist(assetId)) {
            removeFromWatchlist(assetId);
        } else {
            addToWatchlist(assetId);
        }
    };

    const addAlert = (alert) => {
        setAlerts(prev => [...prev, { ...alert, id: Date.now() }]);
    };

    const removeAlert = (alertId) => {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
    };

    return (
        <MarketContext.Provider value={{
            marketType,
            toggleMarketType,
            watchlist: Array.from(watchlist),
            addToWatchlist,
            removeFromWatchlist,
            toggleWatchlist,
            isInWatchlist,
            alerts,
            addAlert,
            removeAlert
        }}>
            {children}
        </MarketContext.Provider>
    );
};
