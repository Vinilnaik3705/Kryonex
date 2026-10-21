import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    Search, Menu, X, ArrowRight, ArrowUpRight, TrendingUp, Github,
    Linkedin, Twitter, Mail, Phone, Sparkles, Shield, Zap, Activity,
    LineChart, Globe2, Lock, Cpu, BarChart3, Star, Check, Plus,
} from 'lucide-react';

import AuroraBackground from '../components/ui/AuroraBackground';
import TickerTape from '../components/ui/TickerTape';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import Reveal from '../components/ui/Reveal';

// Crypto-only demo data (NO stocks)
const DEMO_MARKETS = [
    { symbol: 'BTC', name: 'Bitcoin', price: '64,231.50', change: 2.4, up: true, color: '#F7931A' },
    { symbol: 'ETH', name: 'Ethereum', price: '3,452.10', change: 1.8, up: true, color: '#627EEA' },
    { symbol: 'SOL', name: 'Solana', price: '142.30', change: -1.2, up: false, color: '#14F195' },
    { symbol: 'BNB', name: 'BNB', price: '582.40', change: 0.6, up: true, color: '#F3BA2F' },
    { symbol: 'XRP', name: 'XRP', price: '0.5210', change: 3.1, up: true, color: '#23292F' },
];

const STATS = [
    { value: 450, suffix: '+', label: 'Crypto assets tracked', decimals: 0 },
    { value: 99.98, suffix: '%', label: 'Real-time uptime', decimals: 2 },
    { value: 2.1, suffix: 'M+', label: 'Trades simulated', decimals: 1 },
    { value: 120, suffix: '+', label: 'Countries served', decimals: 0 },
];

const FEATURES = [
    { icon: LineChart, title: 'Professional Charting', desc: 'Interactive candlestick charts with 100+ indicators, multi-timeframe analysis, and live streaming data.', tint: 'from-indigo-500 to-violet-500' },
    { icon: BarChart3, title: 'Squarified Heatmap', desc: 'A professional treemap heatmap with market-cap sizing and real-time performance tracking.', tint: 'from-emerald-500 to-teal-500' },
    { icon: Cpu, title: 'Kryonex AI Analyst', desc: 'In-app AI companion providing deep-dive analysis, risk levels, and news impact for any coin.', tint: 'from-violet-500 to-fuchsia-500' },
    { icon: Shield, title: 'Risk-Free Trading', desc: 'Master crypto markets without risk. Track holdings, P/L, and dynamic asset allocation.', tint: 'from-blue-500 to-cyan-500' },
    { icon: Activity, title: 'Real-time Data', desc: 'Live tracking and analysis for top cryptocurrencies, streamed in near real-time.', tint: 'from-rose-500 to-orange-500' },
    { icon: Globe2, title: 'Multi-Currency', desc: 'Real-time conversion between USD and INR across the entire platform.', tint: 'from-amber-500 to-yellow-500' },
];

const STEPS = [
    { n: '01', title: 'Create your account', desc: 'Sign in securely in seconds with Google or GitHub. No paperwork, no waiting.' },
    { n: '02', title: 'Explore live markets', desc: 'Browse 450+ cryptocurrencies with real-time prices, heatmaps, and AI insights.' },
    { n: '03', title: 'Trade risk-free', desc: 'Simulate orders, build a portfolio, and refine your strategy with zero exposure.' },
];

// ── Small inline visual helpers ──

const Sparkline = ({ color = '#6366F1', up = true, width = 120, height = 36 }) => {
    const path = up
        ? 'M0 28 L15 24 L30 26 L45 18 L60 20 L75 12 L90 14 L105 6 L120 4'
        : 'M0 6 L15 10 L30 8 L45 16 L60 14 L75 22 L90 20 L105 26 L120 28';
    return (
        <svg width={width} height={height} viewBox="0 0 120 36" fill="none" className="overflow-visible">
            <defs>
                <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <motion.path
                d={`${path} L120 36 L0 36 Z`}
                fill={`url(#sg-${color.replace('#', '')})`}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3 }}
            />
            <motion.path
                d={path}
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, ease: 'easeInOut' }}
            />
        </svg>
    );
};

const CoinBadge = ({ symbol, color }) => (
    <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm"
        style={{ background: color }}
    >
        {symbol[0]}
    </div>
);

const NavItem = ({ label, target, onClick }) => (
    <button
        onClick={() => { document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' }); onClick && onClick(); }}
        className="relative text-sm font-medium text-text-muted hover:text-text-main transition-colors group py-1"
    >
        {label}
        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-brand-gradient transition-all duration-300 group-hover:w-full" />
    </button>
);

// ── Landing ──

const Landing = () => {
    const { user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className="min-h-screen bg-primary text-text-main font-sans relative">

            {/* ════════ NAVBAR ════════ */}
            <motion.nav
                initial={{ y: -24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'py-3' : 'py-5'}`}
            >
                <div className={`absolute inset-0 transition-all duration-300 ${scrolled ? 'backdrop-blur-xl bg-primary/70 border-b border-border shadow-[0_8px_30px_-12px_rgba(10,10,15,0.08)]' : 'bg-transparent'}`} />
                <div className="page-container relative flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 group">
                        <div className="relative w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-soft group-hover:scale-105 transition-transform">
                            <span className="text-white font-bold text-lg font-heading">K</span>
                            <span className="absolute inset-0 rounded-xl bg-brand-gradient blur-md opacity-40 -z-10" />
                        </div>
                        <span className="text-xl font-bold tracking-tighter font-heading">Kryonex</span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden lg:flex items-center gap-8">
                        <NavItem label="Features" target="features" />
                        <NavItem label="Markets" target="markets" />
                        <NavItem label="How it works" target="how" />
                        <NavItem label="AI Analyst" target="ai" />
                    </div>

                    {/* CTAs */}
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <Link to="/dashboard" className="btn-primary px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2">
                                Dashboard <ArrowRight size={15} />
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="btn-secondary px-5 py-2.5 rounded-full text-sm font-semibold">
                                    Log in
                                </Link>
                                <Link to="/register" className="btn-primary px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2">
                                    Get started <ArrowRight size={15} />
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile toggle */}
                    <button className="md:hidden p-2 -mr-2 text-text-main" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menu">
                        {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>

                {/* Mobile menu */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="md:hidden overflow-hidden backdrop-blur-xl bg-primary/90 border-b border-border"
                        >
                            <div className="page-container py-6 flex flex-col gap-4">
                                <NavItem label="Features" target="features" onClick={() => setIsMenuOpen(false)} />
                                <NavItem label="Markets" target="markets" onClick={() => setIsMenuOpen(false)} />
                                <NavItem label="How it works" target="how" onClick={() => setIsMenuOpen(false)} />
                                <NavItem label="AI Analyst" target="ai" onClick={() => setIsMenuOpen(false)} />
                                <div className="h-px bg-border my-2" />
                                {user ? (
                                    <Link to="/dashboard" className="btn-primary text-center px-5 py-3 rounded-full font-semibold">Dashboard</Link>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <Link to="/login" className="btn-secondary text-center px-5 py-3 rounded-full font-semibold">Log in</Link>
                                        <Link to="/register" className="btn-primary text-center px-5 py-3 rounded-full font-semibold">Get started</Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>

            {/* ════════ HERO ════════ */}
            <header ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center pt-28 pb-16 overflow-hidden">
                <AuroraBackground />

                <motion.div
                    style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
                    className="relative z-10 page-container text-center"
                >
                    {/* Eyebrow */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="inline-flex items-center gap-2 pill mb-8"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                        </span>
                        <span className="text-text-muted">Live crypto markets · Risk-free simulation</span>
                    </motion.div>

                    {/* Headline */}
                    <h1 className="font-heading font-bold tracking-tightest text-text-main text-[clamp(2.75rem,9vw,7.5rem)] leading-[0.95]">
                        <HeadlineLine delay={0.15}>
                            <span className="text-gradient-animated">Precision</span> over
                        </HeadlineLine>
                        <HeadlineLine delay={0.3}>
                            prediction.
                        </HeadlineLine>
                    </h1>

                    {/* Subhead */}
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.45 }}
                        className="mt-7 text-lg md:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed"
                    >
                        Analyze the crypto market. Profit in both bull and bear phases. The
                        high-performance trading simulation platform built for serious traders.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3"
                    >
                        <Link
                            to={user ? '/dashboard' : '/register'}
                            className="btn-primary px-7 py-3.5 rounded-full font-semibold flex items-center gap-2 group"
                        >
                            Start trading now
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            to={user ? '/markets' : '/login'}
                            className="btn-secondary px-7 py-3.5 rounded-full font-semibold flex items-center gap-2"
                        >
                            <Search size={16} /> Explore markets
                        </Link>
                    </motion.div>

                    {/* Floating glass stat chips */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.8 }}
                        className="mt-14 grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto"
                    >
                        {DEMO_MARKETS.slice(0, 3).map((m, i) => (
                            <motion.div
                                key={m.symbol}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
                                className="glass-card rounded-2xl p-4 flex items-center gap-3 text-left"
                            >
                                <CoinBadge symbol={m.symbol} color={m.color} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-bold text-sm">{m.symbol}</span>
                                        <span className={`text-xs font-semibold ${m.up ? 'text-success' : 'text-danger'}`}>
                                            {m.up ? '▲' : '▼'} {Math.abs(m.change)}%
                                        </span>
                                    </div>
                                    <span className="text-xs text-text-muted price-mono">${m.price}</span>
                                </div>
                                <Sparkline color={m.up ? '#10B981' : '#F43F5E'} up={m.up} width={48} height={24} />
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Scroll cue */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
                >
                    <div className="w-6 h-10 rounded-full border-2 border-border flex items-start justify-center p-1.5">
                        <motion.div
                            animate={{ y: [0, 12, 0] }}
                            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-1.5 h-1.5 rounded-full bg-brand-500"
                        />
                    </div>
                </motion.div>
            </header>

            {/* ════════ TICKER ════════ */}
            <TickerTape />

            {/* ════════ STATS ════════ */}
            <section className="relative py-20 page-container">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {STATS.map((s, i) => (
                        <Reveal key={s.label} index={i} className="text-center">
                            <div className="font-heading font-bold text-4xl md:text-5xl tracking-tighter text-gradient">
                                <AnimatedCounter value={s.value} suffix={s.suffix} decimals={s.decimals} />
                            </div>
                            <div className="mt-2 text-sm text-text-muted">{s.label}</div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ════════ FEATURES ════════ */}
            <section id="features" className="relative py-24 page-container">
                <Reveal className="text-center max-w-2xl mx-auto mb-14">
                    <span className="pill mb-5"><Sparkles size={13} className="text-brand-500" /> Features</span>
                    <h2 className="font-heading font-bold text-[clamp(2rem,5vw,3.5rem)] tracking-tighter leading-[1.05]">
                        Everything you need to <span className="text-gradient">trade smarter</span>
                    </h2>
                    <p className="mt-4 text-lg text-text-muted">
                        Professional-grade tools, real-time data, and AI-powered insights — all in one beautifully designed platform.
                    </p>
                </Reveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {FEATURES.map((f, i) => (
                        <Reveal key={f.title} index={i}>
                            <div className="group relative surface-card rounded-3xl p-7 h-full hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                                {/* hover glow */}
                                <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br ${f.tint} opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-500`} />
                                <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${f.tint} text-white shadow-lg mb-5`}>
                                    <f.icon size={22} />
                                </div>
                                <h3 className="font-heading font-bold text-xl mb-2">{f.title}</h3>
                                <p className="text-text-muted leading-relaxed">{f.desc}</p>
                                <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-brand-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                    Learn more <ArrowRight size={14} />
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ════════ MARKET PREVIEW ════════ */}
            <section id="markets" className="relative py-24 overflow-hidden">
                <div className="page-container grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
                    <Reveal>
                        <span className="pill mb-5"><TrendingUp size={13} className="text-brand-500" /> Live markets</span>
                        <h2 className="font-heading font-bold text-[clamp(2rem,5vw,3.5rem)] tracking-tighter leading-[1.05]">
                            Real-time crypto, <span className="text-gradient">in focus</span>
                        </h2>
                        <p className="mt-4 text-lg text-text-muted max-w-lg">
                            Track hundreds of cryptocurrencies with live prices, professional charts, and an AI analyst that explains the moves.
                        </p>
                        <ul className="mt-6 space-y-3">
                            {['Squarified market-cap heatmap', 'Live candlestick charting', 'Multi-currency support (USD / INR)', 'AI risk and news analysis'].map((item) => (
                                <li key={item} className="flex items-center gap-3 text-text-main">
                                    <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                                        <Check size={12} strokeWidth={3} />
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <Link to={user ? '/markets' : '/login'} className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold mt-8">
                            Open markets <ArrowRight size={16} />
                        </Link>
                    </Reveal>

                    {/* Animated market card mock */}
                    <Reveal delay={0.15}>
                        <MarketPreviewCard />
                    </Reveal>
                </div>
            </section>

            {/* ════════ HOW IT WORKS ════════ */}
            <section id="how" className="relative py-24">
                <div className="page-container">
                    <Reveal className="text-center max-w-2xl mx-auto mb-14">
                        <span className="pill mb-5"><Zap size={13} className="text-brand-500" /> How it works</span>
                        <h2 className="font-heading font-bold text-[clamp(2rem,5vw,3.5rem)] tracking-tighter leading-[1.05]">
                            From zero to trading <span className="text-gradient">in minutes</span>
                        </h2>
                    </Reveal>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                        {/* connector line */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                        {STEPS.map((s, i) => (
                            <Reveal key={s.n} index={i} className="text-center relative">
                                <div className="relative inline-flex items-center justify-center w-24 h-24 mx-auto mb-5">
                                    <span className="absolute inset-0 rounded-full bg-brand-gradient-soft" />
                                    <span className="relative font-heading font-bold text-3xl text-gradient">{s.n}</span>
                                </div>
                                <h3 className="font-heading font-bold text-xl mb-2">{s.title}</h3>
                                <p className="text-text-muted max-w-xs mx-auto">{s.desc}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════ AI ANALYST ════════ */}
            <section id="ai" className="relative py-24 overflow-hidden">
                <div className="absolute inset-0 bg-brand-gradient-soft opacity-60" />
                <div className="page-container relative grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
                    <Reveal className="order-2 lg:order-1">
                        <AiChatMock />
                    </Reveal>
                    <Reveal delay={0.15} className="order-1 lg:order-2">
                        <span className="pill mb-5"><Cpu size={13} className="text-brand-500" /> Kryonex AI</span>
                        <h2 className="font-heading font-bold text-[clamp(2rem,5vw,3.5rem)] tracking-tighter leading-[1.05]">
                            Your personal <span className="text-gradient">AI analyst</span>
                        </h2>
                        <p className="mt-4 text-lg text-text-muted max-w-lg">
                            Ask about any coin, get risk levels, technical read, and latest news impact — explained in plain language, in seconds.
                        </p>
                        <div className="mt-6 grid grid-cols-2 gap-3 max-w-md">
                            {[
                                { icon: Activity, label: 'Risk analysis' },
                                { icon: LineChart, label: 'Technical read' },
                                { icon: Sparkles, label: 'News impact' },
                                { icon: Lock, label: 'Private & secure' },
                            ].map((b) => (
                                <div key={b.label} className="surface-card rounded-xl p-3 flex items-center gap-2.5 text-sm">
                                    <b.icon size={16} className="text-brand-600" />
                                    {b.label}
                                </div>
                            ))}
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ════════ CTA ════════ */}
            <section className="relative py-28 page-container">
                <Reveal>
                    <div className="relative overflow-hidden rounded-[2rem] p-12 md:p-20 text-center">
                        <div className="absolute inset-0 bg-brand-gradient" />
                        <div className="absolute inset-0 grid-overlay opacity-20" />
                        <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/15 rounded-full blur-3xl animate-aurora" />
                        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-violet-400/30 rounded-full blur-3xl animate-aurora-slow" />
                        <div className="relative">
                            <h2 className="font-heading font-bold text-[clamp(2rem,6vw,4rem)] tracking-tighter text-white leading-[1.05]">
                                Start trading smarter,<br />risk-free, today.
                            </h2>
                            <p className="mt-5 text-lg text-white/85 max-w-xl mx-auto">
                                Join thousands of traders mastering crypto markets with Kryonex.
                            </p>
                            <Link
                                to={user ? '/dashboard' : '/register'}
                                className="mt-9 inline-flex items-center gap-2 bg-white text-brand-700 hover:bg-white/90 px-8 py-4 rounded-full font-bold text-lg shadow-xl transition-all hover:scale-[1.03] active:scale-[0.98]"
                            >
                                Get started free <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* ════════ FOOTER ════════ */}
            <Footer user={user} />
        </div>
    );
};

// ── Headline line with clip-path reveal ──
const HeadlineLine = ({ children, delay = 0 }) => (
    <span className="block overflow-hidden">
        <motion.span
            className="block"
            initial={{ y: '110%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.span>
    </span>
);

// ── Market preview card mock ──
const MarketPreviewCard = () => {
    const [active, setActive] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setActive((a) => (a + 1) % DEMO_MARKETS.length), 2500);
        return () => clearInterval(t);
    }, []);
    return (
        <div className="relative">
            {/* glow */}
            <div className="absolute -inset-4 bg-brand-gradient opacity-10 blur-3xl rounded-[2.5rem]" />
            <div className="relative surface-card rounded-3xl p-6 shadow-card-hover">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
                        </span>
                        <span className="text-sm font-semibold">Live Market</span>
                    </div>
                    <span className="text-xs text-text-dim price-mono">24h</span>
                </div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={active}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.4 }}
                        className="flex items-end justify-between gap-4 mb-5"
                    >
                        <div className="flex items-center gap-3">
                            <CoinBadge symbol={DEMO_MARKETS[active].symbol} color={DEMO_MARKETS[active].color} />
                            <div>
                                <div className="font-bold text-lg">{DEMO_MARKETS[active].name}</div>
                                <div className="text-xs text-text-muted">{DEMO_MARKETS[active].symbol}/USD</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="price-mono font-bold text-xl">${DEMO_MARKETS[active].price}</div>
                            <div className={`text-sm font-semibold ${DEMO_MARKETS[active].up ? 'text-success' : 'text-danger'}`}>
                                {DEMO_MARKETS[active].up ? '▲' : '▼'} {Math.abs(DEMO_MARKETS[active].change)}%
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
                {/* Big animated chart */}
                <div className="h-40 -mx-2">
                    <Sparkline color="#6366F1" up width={420} height={160} />
                </div>
                {/* mini list */}
                <div className="mt-5 space-y-1">
                    {DEMO_MARKETS.map((m, i) => (
                        <button
                            key={m.symbol}
                            onClick={() => setActive(i)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${i === active ? 'bg-brand-50' : 'hover:bg-hover'}`}
                        >
                            <div className="flex items-center gap-2.5">
                                <CoinBadge symbol={m.symbol} color={m.color} />
                                <span className="text-sm font-semibold">{m.symbol}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm price-mono text-text-muted">${m.price}</span>
                                <span className={`text-xs font-semibold w-14 text-right ${m.up ? 'text-success' : 'text-danger'}`}>
                                    {m.up ? '+' : ''}{m.change}%
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ── AI chat mock ──
const AiChatMock = () => {
    return (
        <div className="relative">
            <div className="absolute -inset-4 bg-brand-gradient opacity-10 blur-3xl rounded-[2.5rem]" />
            <div className="relative surface-card rounded-3xl p-6 shadow-card-hover">
                <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-border">
                    <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-white">
                        <Cpu size={18} />
                    </div>
                    <div>
                        <div className="font-bold text-sm">Kryonex AI Analyst</div>
                        <div className="text-xs text-text-muted flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" /> Online
                        </div>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="ml-auto max-w-[80%] bg-brand-gradient text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm mb-3"
                >
                    Analyze BTC. Should I be concerned short-term?
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="max-w-[88%] surface-card rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <span className="pill !py-0.5 !text-[10px] bg-amber-100 text-amber-700 border-amber-200">Medium Risk</span>
                        <span className="text-xs text-text-dim">72% confidence</span>
                    </div>
                    BTC shows strong momentum above key support. RSI nearing overbought — a healthy pullback is possible, but the trend remains bullish short-term.
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7 }}
                    className="flex gap-2 mt-4"
                >
                    {['Technical read', 'News impact', 'Risk level'].map((c) => (
                        <span key={c} className="pill !text-[11px]">{c}</span>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

// ── Footer ──
const Footer = ({ user }) => {
    const link = (path) => user ? path : '/login';
    const SocialIcon = ({ href, children, hover }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-10 h-10 rounded-full surface-card flex items-center justify-center text-text-muted ${hover} transition-all hover:-translate-y-0.5`}
        >
            {children}
        </a>
    );
    return (
        <footer className="relative border-t border-border bg-secondary/40">
            <div className="page-container py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1 space-y-5">
                        <Link to="/" className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-soft">
                                <span className="text-white font-bold text-lg font-heading">K</span>
                            </div>
                            <span className="text-xl font-bold tracking-tighter font-heading">Kryonex</span>
                        </Link>
                        <p className="text-sm text-text-muted leading-relaxed">
                            Advanced crypto trading simulation. Master the markets, risk-free.
                        </p>
                        <div className="space-y-2.5 text-sm text-text-muted">
                            <a href="mailto:vinilnaikdharavath3705@gmail.com" className="flex items-center gap-2.5 hover:text-text-main">
                                <Mail size={15} className="text-brand-500" /> vinilnaikdharavath3705@gmail.com
                            </a>
                            <a href="tel:+919642033763" className="flex items-center gap-2.5 hover:text-text-main">
                                <Phone size={15} className="text-brand-500" /> +91 9642033763
                            </a>
                        </div>
                    </div>

                    {/* Platform */}
                    <div>
                        <h4 className="text-sm font-bold mb-4">Platform</h4>
                        <ul className="space-y-2.5 text-sm text-text-muted">
                            <li><Link to={link('/dashboard')} className="hover:text-text-main">Dashboard</Link></li>
                            <li><Link to={link('/markets')} className="hover:text-text-main">Live Markets</Link></li>
                            <li><Link to={link('/heatmap')} className="hover:text-text-main">Heatmaps</Link></li>
                            <li><Link to={link('/trade/BTC')} className="hover:text-text-main">Advanced Trade</Link></li>
                        </ul>
                    </div>

                    {/* Project */}
                    <div>
                        <h4 className="text-sm font-bold mb-4">Project</h4>
                        <ul className="space-y-2.5 text-sm text-text-muted">
                            <li><Link to="/documentation" className="hover:text-text-main">Documentation</Link></li>
                            <li><Link to="/features" className="hover:text-text-main">Features</Link></li>
                            <li><Link to="/updates" className="hover:text-text-main">Updates</Link></li>
                        </ul>
                    </div>

                    {/* Connect */}
                    <div>
                        <h4 className="text-sm font-bold mb-4">Connect</h4>
                        <div className="flex gap-2.5">
                            <SocialIcon href="https://github.com/Vinilnaik3705" hover="hover:!text-white">
                                <Github size={18} />
                            </SocialIcon>
                            <SocialIcon href="https://www.linkedin.com/in/vinil-naik-76484a281/" hover="hover:!text-[#0077B5]">
                                <Linkedin size={18} />
                            </SocialIcon>
                            <SocialIcon href="https://x.com/DV_Naik3705" hover="hover:!text-text-main">
                                <Twitter size={18} />
                            </SocialIcon>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-text-dim">
                    <p>© {new Date().getFullYear()} Kryonex. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link to="/privacy-policy" className="hover:text-text-main">Privacy Policy</Link>
                        <Link to="/terms-of-service" className="hover:text-text-main">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Landing;
