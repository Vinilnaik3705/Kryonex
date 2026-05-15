import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, LogOut, Menu, ArrowRightLeft, Star, Settings, X, Grid2X2 } from 'lucide-react';
import CommandPalette from '../components/ui/CommandPalette';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CurrencyToggle from '../components/CurrencyToggle';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const SidebarItem = ({ icon: Icon, label, path, active }) => (
    <Link
        to={path}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-[12px] font-medium tracking-wide relative
            ${active
                ? 'text-accent bg-accent/[0.08]'
                : 'text-[rgba(255,255,255,0.4)] hover:text-white hover:bg-white/[0.04]'
            }`}
    >
        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r bg-accent shadow-[0_0_8px_rgba(56,189,248,0.5)]" />}
        <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
        <span>{label}</span>
    </Link>
);

const MainLayout = ({ children }) => {
    useKeyboardShortcuts();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const { user, logout } = useAuth();
    const { marketType, toggleMarketType, watchlist } = useMarket();
    const { theme } = useTheme();

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
        <div className="flex min-h-screen bg-primary">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex flex-col w-60 border-r border-[rgba(56,189,248,0.12)] bg-black fixed h-full z-20">
                <div className="p-5">
                    {/* Logo */}
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-extrabold tracking-tight text-accent flex items-center gap-1.5">
                            <span className="text-accent/60">⬡</span>
                            TradeSim
                        </h1>

                    </div>

                    {/* User Info */}
                    {user && (
                        <div className="mt-4 flex items-center gap-2.5 p-2.5 bg-white/[0.03] rounded-lg border border-[rgba(255,255,255,0.06)]">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent/80 to-accent/30 flex items-center justify-center text-[10px] font-extrabold text-white shrink-0">
                                {user.name ? user.name[0].toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] text-[rgba(255,255,255,0.3)]">Logged in as</p>
                                <p className="font-bold text-[12px] truncate text-white">{user.name}</p>
                            </div>
                        </div>
                    )}

                    {/* Currency Toggle */}
                    <div className="mt-3">
                        <CurrencyToggle />
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-3 space-y-0.5">
                    {navItems.map((item) => (
                        <SidebarItem
                            key={item.path}
                            {...item}
                            active={location.pathname + location.search === item.path}
                        />
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 text-[rgba(255,255,255,0.3)] hover:text-danger hover:bg-danger/[0.08] w-full rounded-lg transition-all text-[12px] font-medium"
                    >
                        <LogOut size={17} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full bg-black/95 backdrop-blur-md z-30 border-b border-[rgba(56,189,248,0.12)]">
                <div className="p-3 sm:p-4 flex justify-between items-center w-full box-border">
                    <span className="font-extrabold text-accent flex items-center gap-1.5" style={{ fontSize: 'clamp(14px, 4vw, 18px)' }}>
                        <span className="text-accent/60 opacity-50">⬡</span> TradeSim
                    </span>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <CurrencyToggle />

                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-1 hover:bg-white/10 rounded-lg">
                            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>


            </div>

            {/* Main Content */}
            <main className="flex-1 md:ml-60 p-4 sm:p-6 pt-16 md:pt-6 min-h-screen">
                {children}
            </main>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Slide-in Menu */}
                    <div className="fixed inset-y-0 right-0 w-60 bg-black border-l border-[rgba(56,189,248,0.12)] z-50 md:hidden overflow-y-auto">
                        <div className="p-5">
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-sm font-bold text-white">Menu</h2>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="text-white p-1">
                                    <X size={18} />
                                </button>
                            </div>

                            {user && (
                                <div className="mb-5 flex items-center gap-2.5 p-2.5 bg-white/[0.03] rounded-lg border border-[rgba(255,255,255,0.06)]">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent/80 to-accent/30 flex items-center justify-center text-[10px] font-extrabold text-white shrink-0">
                                        {user.name ? user.name[0].toUpperCase() : 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] text-[rgba(255,255,255,0.3)]">Logged in as</p>
                                        <p className="font-bold text-[12px] truncate text-white">{user.name}</p>
                                    </div>
                                </div>
                            )}

                            <nav className="space-y-0.5">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-[12px] font-medium
                                            ${location.pathname === item.path
                                                ? 'bg-accent/[0.08] text-accent'
                                                : 'text-[rgba(255,255,255,0.4)] hover:text-white hover:bg-white/[0.04]'
                                            }`}
                                    >
                                        <item.icon size={17} />
                                        <span>{item.label}</span>
                                    </Link>
                                ))}
                            </nav>

                            <button
                                className="flex items-center gap-3 px-3 py-2.5 text-[rgba(255,255,255,0.3)] hover:text-danger hover:bg-danger/[0.08] w-full rounded-lg transition-all text-[12px] font-medium mt-5"
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    handleLogout();
                                }}
                            >
                                <LogOut size={17} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            <CommandPalette />
        </div>
    );
};

export default MainLayout;
