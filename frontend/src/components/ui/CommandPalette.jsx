import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowRight, LayoutDashboard, Wallet, Settings, TrendingUp, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();

    // Toggle Open/Close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Mock Data for Commands (crypto-only)
    const commands = useMemo(() => [
        { id: 'home', label: 'Go to Dashboard', icon: LayoutDashboard, type: 'navigation', path: '/' },
        { id: 'markets', label: 'Go to Markets', icon: TrendingUp, type: 'navigation', path: '/markets' },
        { id: 'portfolio', label: 'Go to Portfolio', icon: Wallet, type: 'navigation', path: '/portfolio' },
        { id: 'settings', label: 'Go to Settings', icon: Settings, type: 'navigation', path: '/settings' },

        { id: 'btc', label: 'Bitcoin (BTC)', icon: TrendingUp, type: 'asset', path: '/trade/BTC' },
        { id: 'eth', label: 'Ethereum (ETH)', icon: TrendingUp, type: 'asset', path: '/trade/ETH' },
        { id: 'sol', label: 'Solana (SOL)', icon: TrendingUp, type: 'asset', path: '/trade/SOL' },
        { id: 'bnb', label: 'BNB (BNB)', icon: TrendingUp, type: 'asset', path: '/trade/BNB' },
        { id: 'xrp', label: 'XRP (XRP)', icon: TrendingUp, type: 'asset', path: '/trade/XRP' },

    ], []);

    // Filter Logic
    const filteredCommands = useMemo(() => {
        if (!query) return commands.slice(0, 5); // Show recent/top 5 by default
        const lowerQuery = query.toLowerCase();
        return commands.filter(cmd =>
            cmd.label.toLowerCase().includes(lowerQuery) ||
            (cmd.type === 'asset' && cmd.id.includes(lowerQuery))
        ).slice(0, 8);
    }, [query, commands]);

    // Selection Logic
    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredCommands]);

    const handleSelect = (command) => {
        if (command.type === 'navigation' || command.type === 'asset') {
            navigate(command.path);
        } else if (command.type === 'action' && command.action) {
            command.action();
        }
        setIsOpen(false);
        setQuery('');
    };

    // Keyboard Navigation in List
    useEffect(() => {
        if (!isOpen) return;

        const handleNavigation = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    handleSelect(filteredCommands[selectedIndex]);
                }
            }
        };

        window.addEventListener('keydown', handleNavigation);
        return () => window.removeEventListener('keydown', handleNavigation);
    }, [isOpen, selectedIndex, filteredCommands]); // Added dependencies

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
                    />

                    {/* Palette Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -8 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed top-[18%] left-1/2 -translate-x-1/2 w-full max-w-xl z-[101] px-4"
                    >
                        <div className="glass-card rounded-2xl overflow-hidden flex flex-col max-h-[60vh] shadow-card-hover">

                            {/* Input Area */}
                            <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
                                <Search className="text-text-dim" size={20} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search assets, pages, or commands..."
                                    className="flex-1 bg-transparent text-lg text-text-main placeholder:text-text-dim focus:outline-none"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <span className="text-[10px] font-bold text-text-dim bg-hover px-2 py-1 rounded">ESC</span>
                            </div>

                            {/* Results List */}
                            <div className="overflow-y-auto p-2 scrollbar-thin">
                                {filteredCommands.length > 0 ? (
                                    <div className="space-y-1">
                                        {filteredCommands.map((cmd, index) => (
                                            <button
                                                key={cmd.id}
                                                onClick={() => handleSelect(cmd)}
                                                onMouseEnter={() => setSelectedIndex(index)}
                                                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm transition-all group relative ${
                                                    index === selectedIndex
                                                        ? 'bg-brand-50 text-brand-700'
                                                        : 'text-text-muted hover:bg-hover hover:text-text-main'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <cmd.icon size={18} className={index === selectedIndex ? 'text-brand-600' : 'text-text-dim group-hover:text-text-main'} />
                                                    <span className="font-medium">{cmd.label}</span>
                                                </div>
                                                {cmd.type === 'asset' && (
                                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                                        index === selectedIndex ? 'bg-brand-100 text-brand-700' : 'bg-hover text-text-dim'
                                                    }`}>
                                                        Asset
                                                    </span>
                                                )}
                                                {index === selectedIndex && (
                                                    <ArrowRight size={14} className="text-brand-500" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-text-dim">
                                        No results found.
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="bg-secondary/50 px-4 py-2 border-t border-border flex items-center justify-between text-[10px] text-text-dim font-medium">
                                <div className="flex gap-4">
                                    <span><span className="text-text-main">↑↓</span> navigate</span>
                                    <span><span className="text-text-main">↵</span> select</span>
                                </div>
                                <span>Kryonex</span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
