import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Menu, X, ArrowUpRight, TrendingUp, Newspaper, Github, Linkedin, Twitter, Mail, Phone } from 'lucide-react';
import heroBg from '../assets/background-3d-stars.png';
import elegantBg from '../assets/background-elegant-dark.png';
import proChart from '../assets/pro-chart.png';

// Demo Data for Markets
const DEMO_MARKETS = [
    { symbol: 'BTC/USD', price: '64,231.50', change: '+2.4%', up: true },
    { symbol: 'ETH/USD', price: '3,452.10', change: '+1.8%', up: true },
    { symbol: 'TSLA', price: '245.30', change: '-0.5%', up: false },
    { symbol: 'AAPL', price: '182.90', change: '+0.2%', up: true },
    { symbol: 'NVDA', price: '920.00', change: '+3.1%', up: true },
];

const Landing = () => {
    const { user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Scroll Handler for Navbar Styling
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Smooth Scroll to Section
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setIsMenuOpen(false);
        }
    };

    const NavbarLink = ({ to, label, isScrollId }) => (
        <button
            onClick={() => isScrollId ? scrollToSection(to) : null}
            className="text-slate-300 hover:text-white font-medium transition-colors cursor-pointer"
        >
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#2962FF] selection:text-white relative">

            {/* Navbar */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/90 backdrop-blur-md shadow-lg py-4' : 'bg-black/20 backdrop-blur-sm py-6'
                }`}>
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-12">
                        <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 group">
                            <img src="/logo.png" alt="Kryonex Logo" className="w-9 h-9 object-contain" />
                            <span className="text-2xl font-bold tracking-tight">Kryonex</span>
                        </Link>

                        <div className="hidden lg:flex items-center gap-8 text-sm font-medium">
                            <NavbarLink to="products" label="Products" isScrollId={true} />
                            <NavbarLink to="markets" label="Markets" isScrollId={true} />
                            <NavbarLink to="news" label="News" isScrollId={true} />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex items-center bg-[#1E222D] rounded-full px-4 py-2 border border-white/10 text-slate-400 gap-2 hover:border-white/20 transition-all cursor-text w-64 group">
                            <Search size={16} className="group-hover:text-white transition-colors" />
                            <span className="text-sm">Search markets</span>
                            <span className="ml-auto text-xs bg-[#2A2E39] px-2 py-0.5 rounded text-slate-500">Ctrl+K</span>
                        </div>

                        <div className="hidden md:flex items-center gap-4">
                            {user ? (
                                <Link to="/dashboard" className="bg-[#2962FF] hover:bg-[#1e4bd1] text-white px-6 py-2 rounded-full font-medium transition-colors">
                                    Dashboard
                                </Link>
                            ) : (
                                <Link to="/login" className="text-slate-300 hover:text-white font-medium transition-colors">
                                    Log in
                                </Link>
                            )}
                            <Link to="/register" className="bg-[#2962FF] hover:bg-[#1e4bd1] hover:scale-105 active:scale-95 text-white px-6 py-2 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(41,98,255,0.3)]">
                                Get started
                            </Link>
                        </div>

                        <button className="lg:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {isMenuOpen && (
                    <div className="lg:hidden absolute top-full left-0 right-0 bg-[#0A0A0A] border-y border-white/10 p-6 flex flex-col gap-6 shadow-2xl animate-in slide-in-from-top-5">
                        <div className="flex flex-col gap-4">
                            <NavbarLink to="products" label="Products" isScrollId={true} />
                            <NavbarLink to="markets" label="Markets" isScrollId={true} />
                            <NavbarLink to="news" label="News" isScrollId={true} />
                        </div>
                        <div className="h-[1px] bg-white/5" />
                        <div className="flex flex-col gap-4">
                            {user ? (
                                <Link to="/dashboard" className="text-center bg-[#2962FF] text-white px-6 py-3 rounded-xl font-bold">
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="text-center text-slate-300 hover:text-white font-medium py-2">
                                        Log in
                                    </Link>
                                    <Link to="/register" className="text-center bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-slate-200">
                                        Get started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <header className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src={heroBg} alt="Space Background" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#050505]" />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto space-y-6 animate-fade-in-up">
                    <h1 className="text-5xl md:text-7xl lg:text-9xl font-bold tracking-tighter text-white leading-[1.1]">
                        <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Precision</span>
                        <span className="text-white block md:inline"> over </span>
                        <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Prediction</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
                        Analyze the market. Profit in both bull and bear phases.
                    </p>
                    <div className="pt-8">
                        <button onClick={() => scrollToSection('markets')} className="bg-white text-black hover:bg-slate-200 px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 active:scale-95">
                            Start Trading Now
                        </button>
                    </div>
                </div>
            </header>

            {/* Content Sections Background Wrapper */}
            <div className="relative">
                <div className="absolute inset-0 z-0">
                    <img src={elegantBg} alt="Elegant Background" className="w-full h-full object-cover opacity-30 fixed-bg" />
                    <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-[2px]" />
                </div>

                {/* Products Section */}
                <section id="products" className="relative z-10 min-h-screen flex items-center py-20 border-t border-white/5">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col md:flex-row items-center gap-12">
                            <div className="flex-1 space-y-6">
                                <h2 className="text-4xl md:text-6xl font-bold text-white">Advanced <span className="text-[#2962FF]">Charting</span></h2>
                                <p className="text-xl text-slate-400">Professional-grade tools for serious traders. Multiple chart layouts, 100+ indicators, and real-time data streaming.</p>
                                <ul className="space-y-4 text-slate-300">
                                    {['Multi-monitor support', 'Custom scripts', 'Cloud syncing'].map(item => (
                                        <li key={item} className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-[#2962FF]/20 flex items-center justify-center text-[#2962FF]"><ArrowUpRight size={14} /></div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex-1 rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
                                <img
                                    src={proChart}
                                    alt="Pro Chart Interface"
                                    className="w-full h-auto transform transition-transform duration-700 group-hover:scale-105"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Markets Section (DEMO VIEW) */}
                <section id="markets" className="relative z-10 min-h-screen flex flex-col justify-center py-20 border-t border-white/5">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">Market <span className="text-green-400">Overview</span></h2>
                            <p className="text-slate-400 text-lg">Real-time global market data coverage. (Demo View)</p>
                        </div>

                        <div className="max-w-4xl mx-auto bg-[#131722] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="grid grid-cols-4 bg-[#1E222D] p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-white/5">
                                <div>Symbol</div>
                                <div className="text-right">Price</div>
                                <div className="text-right">Change</div>
                                <div className="text-right">Trend</div>
                            </div>
                            <div className="divide-y divide-white/5">
                                {DEMO_MARKETS.map((market, idx) => (
                                    <div key={idx} className="grid grid-cols-4 p-5 hover:bg-white/5 transition-colors cursor-pointer group items-center">
                                        <div className="font-bold text-white flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">{market.symbol[0]}</span>
                                            {market.symbol}
                                        </div>
                                        <div className="text-right font-mono text-slate-300">{market.price}</div>
                                        <div className={`text-right font-mono font-medium ${market.up ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
                                            {market.change}
                                        </div>
                                        <div className="text-right flex justify-end">
                                            <TrendingUp size={16} className={`${market.up ? 'text-[#4ADE80]' : 'text-[#F87171] transform rotate-180'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-[#1E222D] text-center">
                                <Link to="/markets" className="text-sm text-[#2962FF] hover:text-white transition-colors font-medium">
                                    View Full Market Data →
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* News Section */}
                <section id="news" className="relative z-10 min-h-screen flex items-center py-20 border-t border-white/5">
                    <div className="container mx-auto px-6">
                        <h2 className="text-4xl md:text-6xl font-bold text-white mb-12 flex items-center gap-4">
                            <Newspaper size={48} className="text-yellow-400" />
                            Latest <span className="text-yellow-400">News</span>
                        </h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex gap-6 p-6 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 cursor-pointer">
                                    <div className="w-24 h-24 bg-slate-800 rounded-lg flex-shrink-0" />
                                    <div>
                                        <div className="text-xs text-[#2962FF] font-bold mb-2 uppercase tracking-wide">Crypto • 2h ago</div>
                                        <h3 className="text-xl font-bold mb-2 leading-tight group-hover:text-[#2962FF] transition-colors">Bitcoin breaks key resistance level as institutional interest surges.</h3>
                                        <p className="text-sm text-slate-400 line-clamp-2">Analysts predict a strong upward trend following the latest ETF approvals...</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Detailed Footer */}
                <footer className="relative z-10 bg-black pt-20 pb-10 border-t border-white/10 text-sm">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

                            {/* Brand / Contact */}
                            <div className="space-y-6">
                                <Link to="/" className="flex items-center gap-3 group">
                                    <img src="/logo.png" alt="Kryonex Logo" className="w-8 h-8 object-contain" />
                                    <span className="text-2xl font-bold tracking-tight text-white">Kryonex</span>
                                </Link>
                                <p className="text-slate-400 leading-relaxed">
                                    Advanced trading simulation platform for modern investors. Master the markets risk-free.
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <Mail size={16} className="text-[#2962FF]" />
                                        <a href="mailto:vinilnaikdharavath3705@gmail.com" className="hover:text-white transition-colors">vinilnaikdharavath3705@gmail.com</a>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <Phone size={16} className="text-[#2962FF]" />
                                        <a href="tel:+919642033763" className="hover:text-white transition-colors">+91 9642033763</a>
                                    </div>
                                </div>
                            </div>

                            {/* Features Links */}
                            <div>
                                <h3 className="text-white font-bold mb-6">Platform</h3>
                                <ul className="space-y-4 text-slate-400">
                                    <li><Link to={user ? "/dashboard" : "/login"} className="hover:text-[#2962FF] transition-colors">Dashboard</Link></li>
                                    <li><Link to={user ? "/markets" : "/login"} className="hover:text-[#2962FF] transition-colors">Live Markets</Link></li>
                                    <li><Link to={user ? "/heatmap" : "/login"} className="hover:text-[#2962FF] transition-colors">Heatmaps</Link></li>
                                    <li><Link to={user ? "/trade/BTC" : "/login"} className="hover:text-[#2962FF] transition-colors">Advanced Trade</Link></li>
                                </ul>
                            </div>

                            {/* Project / Company */}
                            <div>
                                <h3 className="text-white font-bold mb-6">Project</h3>
                                <ul className="space-y-4 text-slate-400">
                                    <li><Link to="/documentation" className="hover:text-[#2962FF] transition-colors">Documentation</Link></li>
                                    <li><Link to="/features" className="hover:text-[#2962FF] transition-colors">Features List</Link></li>
                                    <li><Link to="/updates" className="hover:text-[#2962FF] transition-colors">Updates</Link></li>
                                </ul>
                            </div>

                            {/* Socials */}
                            <div>
                                <h3 className="text-white font-bold mb-6">Connect</h3>
                                <div className="flex gap-4">
                                    <a href="https://github.com/Vinilnaik3705" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#2962FF] hover:text-white transition-all text-slate-400">
                                        <Github size={20} />
                                    </a>
                                    <a href="https://www.linkedin.com/in/vinil-naik-76484a281/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#0077B5] hover:text-white transition-all text-slate-400">
                                        <Linkedin size={20} />
                                    </a>
                                    <a href="https://x.com/DV_Naik3705" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-black hover:text-white transition-all text-slate-400 border border-white/5">
                                        <Twitter size={20} />
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                            <p>© 2026 Vinil Naik. All rights reserved.</p>
                            <div className="flex gap-6">
                                <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                                <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
                            </div>
                        </div>
                    </div>
                </footer>

            </div>
        </div>
    );
};

export default Landing;
