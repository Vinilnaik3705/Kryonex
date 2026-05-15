/**
 * AIAnalyst.jsx — AI Market Analyst Feature for TradeSim
 *
 * SETUP:
 * 1. Copy this file to: frontend/src/pages/AIAnalyst.jsx
 * 2. In App.jsx, add the route:
 *      import AIAnalyst from './pages/AIAnalyst';
 *      <Route path="/ai-analyst" element={<ProtectedRoute><AIAnalyst /></ProtectedRoute>} />
 * 3. In MainLayout.jsx sidebar nav, add:
 *      { to: '/ai-analyst', icon: <Sparkles />, label: 'AI Analyst' }
 * 4. Add VITE_ANTHROPIC_API_KEY to frontend/.env.local
 *      VITE_ANTHROPIC_API_KEY=sk-ant-...
 *
 * NOTE: For production, proxy the Anthropic call through your backend
 * to keep the API key server-side. This frontend-direct approach is
 * fine for a capstone/demo. Backend route example:
 *   POST /api/ai/analyze  { symbol, type, price, change, context }
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import MainLayout from '../layouts/MainLayout';
import axios from 'axios';
import { useMarket } from '../context/MarketContext';
import API_BASE_URL from '../config/api';
import {
  Sparkles, TrendingUp, TrendingDown, BarChart2, Search,
  ChevronRight, RefreshCw, AlertTriangle, Zap, Target,
  Shield, Activity, Brain, ArrowUpRight, ArrowDownRight,
  Clock, X, ChevronDown
} from 'lucide-react';

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

// ─── Sentiment badge ────────────────────────────────────────────────────────
const SentimentBadge = ({ sentiment }) => {
  const cfg = {
    Bullish:  { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400', icon: <TrendingUp size={11} /> },
    Bearish:  { bg: 'bg-red-500/15',     text: 'text-red-400',     dot: 'bg-red-400',     icon: <TrendingDown size={11} /> },
    Neutral:  { bg: 'bg-slate-500/15',   text: 'text-slate-400',   dot: 'bg-slate-400',   icon: <Activity size={11} /> },
    Volatile: { bg: 'bg-amber-500/15',   text: 'text-amber-400',   dot: 'bg-amber-400',   icon: <Zap size={11} /> },
  }[sentiment] || { bg: 'bg-slate-500/15', text: 'text-slate-400', dot: 'bg-slate-400', icon: <Activity size={11} /> };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      {cfg.icon}
      {sentiment}
    </span>
  );
};

// ─── Score ring ──────────────────────────────────────────────────────────────
const ScoreRing = ({ score, label, color }) => {
  const r = 28, circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor"
            strokeWidth="5" className="text-white/5" />
          <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor"
            strokeWidth="5" strokeDasharray={`${filled} ${circ - filled}`}
            strokeLinecap="round" className={color}
            style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)' }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
          {score}
        </span>
      </div>
      <span className="text-[11px] text-slate-500 font-medium">{label}</span>
    </div>
  );
};

// ─── Streaming text renderer ─────────────────────────────────────────────────
const StreamingText = ({ text, isStreaming }) => {
  const formatted = text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/^### (.+)$/gm, '<h3 class="text-[--color-accent] font-bold text-sm mt-4 mb-1 tracking-wide uppercase">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-white font-bold text-base mt-5 mb-2">$1</h2>')
    .replace(/^- (.+)$/gm, '<li class="text-slate-300 text-sm leading-relaxed ml-3 list-disc">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul class="space-y-1 my-2">$&</ul>')
    .replace(/\n\n/g, '</p><p class="text-slate-300 text-sm leading-relaxed mb-3">')
    .replace(/\n/g, '<br/>');

  return (
    <div className="prose-trading">
      <p
        className="text-slate-300 text-sm leading-relaxed mb-3"
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
      {isStreaming && (
        <span className="inline-block w-1.5 h-4 bg-[--color-accent] animate-pulse rounded-sm ml-0.5" />
      )}
    </div>
  );
};

// ─── Analysis card sections ──────────────────────────────────────────────────
const AnalysisSection = ({ icon, title, children, accent }) => (
  <div className={`rounded-xl border p-4 ${accent ? 'border-[--color-accent]/20 bg-[--color-accent]/5' : 'border-white/[0.06] bg-white/[0.02]'}`}>
    <div className="flex items-center gap-2 mb-3">
      <span className={`${accent ? 'text-[--color-accent]' : 'text-slate-400'}`}>{icon}</span>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
    </div>
    {children}
  </div>
);

// ─── Parsed analysis display ─────────────────────────────────────────────────
const AnalysisDisplay = ({ analysis, asset }) => {
  if (!analysis) return null;

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header with sentiment + scores */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-white/[0.08] bg-white/[0.03]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SentimentBadge sentiment={analysis.sentiment} />
            <span className="text-xs text-slate-500">{asset.symbol} · AI Analysis</span>
          </div>
          <p className="text-white font-semibold text-lg">{analysis.headline}</p>
          <p className="text-slate-400 text-sm mt-0.5">{analysis.summary}</p>
        </div>
        <div className="flex gap-6">
          <ScoreRing score={analysis.scores?.momentum ?? 0} label="Momentum" color="text-sky-400" />
          <ScoreRing score={analysis.scores?.risk ?? 0} label="Risk" color="text-rose-400" />
          <ScoreRing score={analysis.scores?.opportunity ?? 0} label="Opportunity" color="text-emerald-400" />
        </div>
      </div>

      {/* Detailed analysis grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnalysisSection icon={<BarChart2 size={16} />} title="Technical Outlook" accent>
          <StreamingText text={analysis.technical} isStreaming={false} />
        </AnalysisSection>

        <AnalysisSection icon={<Brain size={16} />} title="Fundamental View">
          <StreamingText text={analysis.fundamental} isStreaming={false} />
        </AnalysisSection>

        <AnalysisSection icon={<AlertTriangle size={16} />} title="Key Risks">
          <StreamingText text={analysis.risks} isStreaming={false} />
        </AnalysisSection>

        <AnalysisSection icon={<Target size={16} />} title="Price Targets & Strategy">
          <StreamingText text={analysis.strategy} isStreaming={false} />
        </AnalysisSection>
      </div>

      {/* Catalyst list */}
      {analysis.catalysts?.length > 0 && (
        <AnalysisSection icon={<Zap size={16} />} title="Near-term Catalysts">
          <div className="flex flex-wrap gap-2">
            {analysis.catalysts.map((c, i) => (
              <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                {c}
              </span>
            ))}
          </div>
        </AnalysisSection>
      )}

      <p className="text-xs text-slate-600 text-center pt-1">
        AI-generated analysis · Not financial advice · Always do your own research
      </p>
    </div>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────
export default function AIAnalyst() {
  const { marketType, setMarketType } = useMarket();
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [streamText, setStreamText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const abortRef = useRef(null);

  // Fetch asset list
  useEffect(() => {
    const fetchAssets = async () => {
      setAssetsLoading(true);
      try {
        const endpoint = marketType === 'crypto'
          ? `${API_BASE_URL}/crypto/market-cap?limit=30`
          : `${API_BASE_URL}/stocks/top?limit=30`;
        const res = await axios.get(endpoint);
        const data = res.data.data || [];

        const formatted = marketType === 'crypto'
          ? data.map(c => ({
              id: c.baseAsset || c.symbol?.replace('USDT', ''),
              symbol: c.baseAsset || c.symbol?.replace('USDT', ''),
              name: c.baseAsset || c.symbol,
              price: c.price,
              change: c.priceChangePercent,
              type: 'crypto',
            }))
          : data.map(s => ({
              id: s.symbol,
              symbol: s.symbol,
              name: s.name || s.symbol,
              price: s.price,
              change: s.changePercent,
              type: 'stocks',
            }));

        setAssets(formatted);
        if (formatted.length > 0 && !selectedAsset) setSelectedAsset(formatted[0]);
      } catch {
        setError('Could not load assets. Please check your backend connection.');
      } finally {
        setAssetsLoading(false);
      }
    };
    fetchAssets();
  }, [marketType]);

  const filteredAssets = assets.filter(a =>
    a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Call Anthropic API (streaming) ────────────────────────────────────────
  const runAnalysis = useCallback(async (asset, question = '') => {
    if (!asset) return;
    if (!ANTHROPIC_API_KEY) {
      setError('VITE_ANTHROPIC_API_KEY is not set in your .env.local file.');
      return;
    }

    setLoading(true);
    setIsStreaming(true);
    setError('');
    setAnalysis(null);
    setStreamText('');

    const prompt = question
      ? `You are an expert financial analyst. The user selected ${asset.symbol} (${asset.name}).
Current price: $${Number(asset.price || 0).toFixed(2)}
24h change: ${Number(asset.change || 0).toFixed(2)}%
Market type: ${asset.type}

User question: "${question}"

Answer in clear, professional language. Be specific and data-driven. Limit to 200 words.`
      : `You are a world-class financial analyst with expertise in technical analysis, fundamental analysis, and market microstructure. Analyze ${asset.symbol} (${asset.name}).

Asset details:
- Symbol: ${asset.symbol}
- Type: ${asset.type === 'crypto' ? 'Cryptocurrency' : 'Stock/ETF'}
- Current price: $${Number(asset.price || 0).toFixed(2)}
- 24h change: ${Number(asset.change || 0).toFixed(2)}%

Return a JSON object (and ONLY a JSON object, no markdown fences, no explanation before or after) with this exact schema:
{
  "sentiment": "Bullish" | "Bearish" | "Neutral" | "Volatile",
  "headline": "<20-word compelling headline>",
  "summary": "<one sentence 30-word summary>",
  "scores": {
    "momentum": <0-100>,
    "risk": <0-100>,
    "opportunity": <0-100>
  },
  "technical": "<100-word technical analysis covering trend, support/resistance, momentum indicators>",
  "fundamental": "<100-word fundamental analysis covering valuation, growth, competitive position>",
  "risks": "<80-word key risks including macro, sector-specific, and asset-specific>",
  "strategy": "<80-word strategy covering entry/exit levels, time horizon, position sizing>",
  "catalysts": ["<catalyst 1>", "<catalyst 2>", "<catalyst 3>"]
}`;

    try {
      if (question) {
        // Streaming text for custom questions
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 600,
            stream: true,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
          for (const line of lines) {
            try {
              const json = JSON.parse(line.slice(6));
              if (json.type === 'content_block_delta' && json.delta?.text) {
                fullText += json.delta.text;
                setStreamText(fullText);
              }
            } catch {}
          }
        }
        setIsStreaming(false);
        setLoading(false);
        return;
      }

      // Structured JSON analysis
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
      const raw = data.content?.[0]?.text || '';
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setAnalysis(parsed);
      setStreamText('');
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsStreaming(false);
      setLoading(false);
    }
  }, []);

  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset);
    setAnalysis(null);
    setStreamText('');
    setShowCustom(false);
    setCustomQuestion('');
  };

  const handleCustomQuestion = (e) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    setAnalysis(null);
    runAnalysis(selectedAsset, customQuestion);
    setShowCustom(false);
    setCustomQuestion('');
  };

  const changeIsPositive = Number(selectedAsset?.change || 0) >= 0;

  return (
    <MainLayout>
      <div className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[--color-accent]/10 border border-[--color-accent]/20">
              <Brain size={20} className="text-[--color-accent]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">AI Market Analyst</h1>
              <p className="text-xs text-slate-500">Powered by Claude · Real-time intelligence</p>
            </div>
          </div>

          {/* Market toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
            {['stocks', 'crypto'].map(m => (
              <button
                key={m}
                onClick={() => { setMarketType(m); setSelectedAsset(null); setAnalysis(null); setStreamText(''); }}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  marketType === m
                    ? 'bg-[--color-accent] text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'crypto' ? '₿ Crypto' : '📈 Stocks'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">

          {/* ── Left sidebar: asset picker ── */}
          <div className="space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[--color-accent]/50 transition-colors"
              />
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <div className="px-3 py-2 border-b border-white/[0.05]">
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Select Asset</span>
              </div>
              <div className="overflow-y-auto max-h-[calc(100vh-280px)] scrollbar-thin">
                {assetsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw size={18} className="text-slate-600 animate-spin" />
                  </div>
                ) : filteredAssets.length === 0 ? (
                  <p className="text-center text-slate-600 text-sm py-8">No assets found</p>
                ) : filteredAssets.map(asset => {
                  const pos = Number(asset.change || 0) >= 0;
                  const isSelected = selectedAsset?.symbol === asset.symbol;
                  return (
                    <button
                      key={asset.id}
                      onClick={() => handleSelectAsset(asset)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-all border-b border-white/[0.03] last:border-0 ${
                        isSelected
                          ? 'bg-[--color-accent]/10 border-l-2 border-l-[--color-accent]'
                          : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                          isSelected ? 'bg-[--color-accent]/20 text-[--color-accent]' : 'bg-white/[0.05] text-slate-400'
                        }`}>
                          {asset.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>{asset.symbol}</p>
                          <p className="text-[11px] text-slate-600 truncate max-w-[120px]">{asset.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-300">${Number(asset.price || 0).toFixed(2)}</p>
                        <p className={`text-[11px] font-medium ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
                          {pos ? '+' : ''}{Number(asset.change || 0).toFixed(2)}%
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Right: analysis area ── */}
          <div className="space-y-4">

            {/* Asset hero card */}
            {selectedAsset && (
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-transparent">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[--color-accent]/10 border border-[--color-accent]/20 flex items-center justify-center font-bold text-[--color-accent] text-base">
                    {selectedAsset.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white">{selectedAsset.symbol}</h2>
                      <span className="text-xs bg-white/[0.07] text-slate-400 px-2 py-0.5 rounded-md">{selectedAsset.name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-2xl font-bold text-white">${Number(selectedAsset.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className={`flex items-center gap-1 text-sm font-semibold ${changeIsPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {changeIsPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {changeIsPositive ? '+' : ''}{Number(selectedAsset.change || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Custom question toggle */}
                  <button
                    onClick={() => setShowCustom(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-400 hover:text-white hover:border-white/20 text-sm transition-all"
                  >
                    <Brain size={14} />
                    Ask AI
                    <ChevronDown size={12} className={`transition-transform ${showCustom ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Analyze button */}
                  <button
                    onClick={() => runAnalysis(selectedAsset)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[--color-accent] text-black font-semibold text-sm hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    {loading ? 'Analyzing...' : 'Analyze'}
                  </button>
                </div>
              </div>
            )}

            {/* Custom question input */}
            {showCustom && selectedAsset && (
              <form onSubmit={handleCustomQuestion} className="flex gap-2">
                <input
                  type="text"
                  value={customQuestion}
                  onChange={e => setCustomQuestion(e.target.value)}
                  placeholder={`Ask anything about ${selectedAsset.symbol}... e.g. "What are the key support levels?"`}
                  className="flex-1 bg-white/[0.04] border border-[--color-accent]/30 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[--color-accent]/60 transition-colors"
                  autoFocus
                />
                <button type="submit" disabled={loading || !customQuestion.trim()}
                  className="px-4 py-2 rounded-lg bg-[--color-accent]/20 border border-[--color-accent]/30 text-[--color-accent] font-semibold text-sm hover:bg-[--color-accent]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5">
                  <ChevronRight size={16} /> Ask
                </button>
              </form>
            )}

            {/* Error state */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-red-400 text-sm font-medium">Analysis Error</p>
                  <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
                </div>
                <button onClick={() => setError('')} className="ml-auto text-slate-600 hover:text-slate-400">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Streaming custom response */}
            {streamText && !analysis && (
              <div className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={14} className="text-[--color-accent]" />
                  <span className="text-xs text-slate-500 font-medium">AI Response · {selectedAsset?.symbol}</span>
                  {isStreaming && <span className="text-xs text-[--color-accent] animate-pulse">● Live</span>}
                </div>
                <StreamingText text={streamText} isStreaming={isStreaming} />
              </div>
            )}

            {/* Full analysis */}
            {analysis && <AnalysisDisplay analysis={analysis} asset={selectedAsset} />}

            {/* Empty state */}
            {!analysis && !streamText && !loading && !error && selectedAsset && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[--color-accent]/10 border border-[--color-accent]/20 flex items-center justify-center mb-4">
                  <Sparkles size={28} className="text-[--color-accent]" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Ready to Analyze {selectedAsset.symbol}</h3>
                <p className="text-slate-500 text-sm max-w-sm mb-6">
                  Get AI-powered technical and fundamental analysis, risk assessment, and price targets powered by Claude.
                </p>
                <button
                  onClick={() => runAnalysis(selectedAsset)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[--color-accent] text-black font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  <Brain size={16} />
                  Run Full Analysis
                </button>
              </div>
            )}

            {!selectedAsset && !assetsLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Target size={32} className="text-slate-700 mb-4" />
                <p className="text-slate-500 text-sm">Select an asset from the left panel to begin</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>
    </MainLayout>
  );
}
