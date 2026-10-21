import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, LogOut, Menu, ArrowRightLeft, Star, Settings, X, Grid2X2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CommandPalette from '../components/ui/CommandPalette';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import CurrencyToggle from '../components/CurrencyToggle';
import AuroraBackground from '../components/ui/AuroraBackground';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const SidebarItem = ({ icon: Icon, label, path, active }) => (
    <Link
        to={path}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[12px] font-medium tracking-wide relative group
            ${active
                ? 'text-brand-700'
                : 'text-text-muted hover:text-text-main hover:bg-hover'
            }`}
    >
        {active && (
            <motion.span
                layoutId="sidebar-active"
                className="absolute inset-0 rounded-xl bg-brand-50/80 border border-brand-200/60"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
        )}
        {active && (
            <motion.span
                layoutId="sidebar-bar"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-brand-gradient"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
        )}
        <Icon size={17} strokeWidth={active ? 2.4 : 1.8} className="relative z-10" />
        <span className="relative z-10">{label}</span>
    </Link>
);

const MainLayout = ({ children }) => {
    useKeyboardShortcuts();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const { user, logout } = useAuth();
    const { watchlist } = useMarket();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: ArrowRightLeft, label: 'Markets', path: '/markets' },
        { icon: Grid2X2, label: 'Heatmap', path: '/heatmap' },
        { icon: Briefcase, label: 'Portfolio', path: '/portfolio' },
        { icon: Star, label: `Watchlist (${watchlist.length})`, path: '/watchlist' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <div className="flex min-h-screen w-full min-w-0 bg-primary">

            {/* ── Sidebar Desktop ── */}
            <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card/75 backdrop-blur-xl fixed h-full z-20">
                <div className="p-5">
                    {/* Logo */}
                    <Link to="/dashboard" className="flex items-center gap-2.5 group">
                        <div className="relative w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-soft group-hover:scale-105 transition-transform">
                            <span className="text-white font-bold text-lg font-heading">K</span>
                            <span className="absolute inset-0 rounded-xl bg-brand-gradient blur-md opacity-40 -z-10" />
                        </div>
                        <span className="text-xl font-bold tracking-tighter font-heading text-text-main group-hover:text-brand-600 transition-colors">Kryonex</span>
                    </Link>

                    {/* User Info */}
                    {user && (
                        <div className="mt-5 flex items-center gap-2.5 p-2.5 rounded-xl bg-card border border-border">
                            <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                                {user.name ? user.name[0].toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-text-dim">Logged in as</p>
                                <p className="font-bold text-[12px] truncate text-text-main">{user.name}</p>
                            </div>
                        </div>
                    )}

                    {/* Currency Toggle */}
                    <div className="mt-3">
                        <CurrencyToggle />
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-3 space-y-1">
                    {navItems.map((item) => (
                        <SidebarItem
                            key={item.path}
                            {...item}
                            active={location.pathname + location.search === item.path}
                        />
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-3 border-t border-border">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 text-text-muted hover:text-danger hover:bg-danger/5 w-full rounded-xl transition-all text-[12px] font-medium"
                    >
                        <LogOut size={17} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* ── Mobile Header ── */}
            <div className="md:hidden fixed top-0 w-full bg-primary/85 backdrop-blur-xl z-30 border-b border-border">
                <div className="p-3 sm:p-4 flex justify-between items-center w-full box-border">
                    <Link to="/dashboard" className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center">
                            <span className="text-white font-bold text-xs font-heading">K</span>
                        </div>
                        <span className="font-bold text-text-main font-heading" style={{ fontSize: 'clamp(14px, 4vw, 18px)' }}>Kryonex</span>
                    </Link>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <CurrencyToggle />
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-text-main p-1 hover:bg-hover rounded-lg">
                            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main Content ── */}
            <main className="flex-1 min-w-0 md:ml-60 relative min-h-screen">
                <AuroraBackground className="absolute inset-0 z-0 pointer-events-none" />
                <div className="relative z-10 p-4 sm:p-6 pt-16 md:pt-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* ── Mobile Menu Overlay ── */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
                            className="fixed inset-y-0 right-0 w-60 bg-primary border-l border-border z-50 md:hidden overflow-y-auto"
                        >
                            <div className="p-5">
                                <div className="flex justify-between items-center mb-5">
                                    <h2 className="text-sm font-bold text-text-main">Menu</h2>
                                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-text-main p-1">
                                        <X size={18} />
                                    </button>
                                </div>

                                {user && (
                                    <div className="mb-5 flex items-center gap-2.5 p-2.5 rounded-xl bg-card border border-border">
                                        <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                                            {user.name ? user.name[0].toUpperCase() : 'U'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-text-dim">Logged in as</p>
                                            <p className="font-bold text-[12px] truncate text-text-main">{user.name}</p>
                                        </div>
                                    </div>
                                )}

                                <nav className="space-y-1">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[12px] font-medium
                                                ${location.pathname === item.path
                                                    ? 'bg-brand-50/80 text-brand-700 border border-brand-200/60'
                                                    : 'text-text-muted hover:text-text-main hover:bg-hover'
                                                }`}
                                        >
                                            <item.icon size={17} />
                                            <span>{item.label}</span>
                                        </Link>
                                    ))}
                                </nav>

                                <button
                                    className="flex items-center gap-3 px-3 py-2.5 text-text-muted hover:text-danger hover:bg-danger/5 w-full rounded-xl transition-all text-[12px] font-medium mt-5"
                                    onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                                >
                                    <LogOut size={17} />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <CommandPalette />
        </div>
    );
};

export default MainLayout;
