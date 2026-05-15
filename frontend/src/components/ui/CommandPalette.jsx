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

    // Mock Data for Commands
    const commands = useMemo(() => [
        { id: 'home', label: 'Go to Dashboard', icon: LayoutDashboard, type: 'navigation', path: '/' },
        { id: 'markets', label: 'Go to Markets', icon: TrendingUp, type: 'navigation', path: '/markets' },
        { id: 'portfolio', label: 'Go to Portfolio', icon: Wallet, type: 'navigation', path: '/portfolio' },
        { id: 'settings', label: 'Go to Settings', icon: Settings, type: 'navigation', path: '/settings' },

        { id: 'btc', label: 'Bitcoin (BTC)', icon: TrendingUp, type: 'asset', path: '/trade/bitcoin' },
        { id: 'eth', label: 'Ethereum (ETH)', icon: TrendingUp, type: 'asset', path: '/trade/ethereum' },
        { id: 'sol', label: 'Solana (SOL)', icon: TrendingUp, type: 'asset', path: '/trade/solana' },
        { id: 'tsla', label: 'Tesla (TSLA)', icon: TrendingUp, type: 'asset', path: '/trade/tesla' },
        { id: 'aapl', label: 'Apple (AAPL)', icon: TrendingUp, type: 'asset', path: '/trade/apple' },

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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Palette Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.1 }}
                        className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-[101] px-4"
                    >
                        <div className="bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh] ring-1 ring-white/10">

                            {/* Input Area */}
                            <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
                                <Search className="text-slate-500" size={20} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search assets, pages, or commands..."
                                    className="flex-1 bg-transparent text-lg text-white placeholder:text-slate-600 focus:outline-none"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded">ESC</span>
                                </div>
                            </div>

                            {/* Results List */}
                            <div className="overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                {filteredCommands.length > 0 ? (
                                    <div className="space-y-1">
                                        {filteredCommands.map((cmd, index) => (
                                            <button
                                                key={cmd.id}
                                                onClick={() => handleSelect(cmd)}
                                                onMouseEnter={() => setSelectedIndex(index)}
                                                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-colors group ${index === selectedIndex ? 'bg-accent text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <cmd.icon size={18} className={index === selectedIndex ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
                                                    <span className="font-medium">{cmd.label}</span>
                                                </div>
                                                {cmd.type === 'asset' && (
                                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${index === selectedIndex ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500'
                                                        }`}>
                                                        Asset
                                                    </span>
                                                )}
                                                {index === selectedIndex && (
                                                    <ArrowRight size={14} className="text-white opacity-50" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-slate-500">
                                        No results found.
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="bg-white/5 px-4 py-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                                <div className="flex gap-4">
                                    <span><span className="text-slate-300">↑↓</span> to navigate</span>
                                    <span><span className="text-slate-300">↵</span> to select</span>
                                </div>
                                <span>Design by Kryonex</span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
