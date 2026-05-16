import React, { useState, useRef, useEffect, useCallback } from 'react';
import API_BASE_URL from '../config/api';
import {
  MessageCircle, X, Send, RefreshCw, AlertTriangle, Shield, ChevronDown, Sparkles, Bot,
  Activity, Minus
} from 'lucide-react';

function parseVerdict(text) {
  const match = text.match(/---VERDICT---([\s\S]*?)---END---/);
  if (!match) return null;
  const block = match[1];
  const get = (key) => {
    const m = block.match(new RegExp(`${key}:\\s*(.+)`));
    return m ? m[1].trim() : null;
  };
  return {
    riskLevel: get('RISK_LEVEL'),
    safe: get('SAFE_TO_INVEST'),
    confidence: parseInt(get('CONFIDENCE') || '0', 10),
    oneLine: get('ONE_LINE'),
  };
}

function stripVerdict(text) {
  return text.replace(/---VERDICT---([\s\S]*?)---END---/g, '').trim();
}

function formatText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/^### (.+)$/gm, '<div class="text-sky-400 font-bold text-xs uppercase tracking-widest mt-3 mb-1">$1</div>')
    .replace(/^## (.+)$/gm, '<div class="text-white font-semibold text-sm mt-4 mb-1">$1</div>')
    .replace(/^# (.+)$/gm, '<div class="text-white font-bold text-base mt-4 mb-2">$1</div>')
    .replace(/^- (.+)$/gm, '<div class="flex gap-1.5 text-slate-300 text-[13px] leading-relaxed"><span class="text-sky-400 mt-[3px] shrink-0">•</span><span>$1</span></div>')
    .replace(/\n\n/g, '<div class="h-2"></div>')
    .replace(/\n/g, '<br/>');
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const providerLabel = GROQ_API_KEY ? 'Live · Powered by LLaMA 3.3 on Groq' : 'AI Analyst';

// Keep a compact system prompt similar to backend for consistent behavior when calling Groq directly
const SYSTEM_PROMPT = `You are Kryonex AI, an elite cryptocurrency analyst AI embedded in the Kryonex trading platform. Provide concise, data-rich analysis and a final risk verdict when asked.`;

const VerdictBadge = ({ verdict }) => {
  if (!verdict) return null;

  const riskCfg = {
    HIGH: { bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-400', icon: <AlertTriangle size={12} />, dot: 'bg-red-400' },
    MEDIUM: { bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-400', icon: <Activity size={12} />, dot: 'bg-amber-400' },
    LOW: { bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400', icon: <Shield size={12} />, dot: 'bg-emerald-400' },
  }[verdict.riskLevel] || { bg: 'bg-slate-500/15 border-slate-500/30', text: 'text-slate-400', icon: <Minus size={12} />, dot: 'bg-slate-400' };

  const safeCfg = {
    YES: { label: 'Safe to Invest', color: 'text-emerald-400' },
    NO: { label: 'Avoid Now', color: 'text-red-400' },
    CAUTION: { label: 'Proceed with Caution', color: 'text-amber-400' },
  }[verdict.safe] || { label: verdict.safe, color: 'text-slate-400' };

  return (
    <div className={`mt-3 rounded-xl border p-3 ${riskCfg.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-1.5 text-xs font-bold ${riskCfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${riskCfg.dot} animate-pulse`} />
          {riskCfg.icon}
          {verdict.riskLevel} RISK
        </div>
        <div className={`text-xs font-semibold ${safeCfg.color}`}>{safeCfg.label}</div>
      </div>
      <p className="text-white text-[13px] font-medium leading-snug">{verdict.oneLine}</p>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${verdict.riskLevel === 'HIGH' ? 'bg-red-400' : verdict.riskLevel === 'MEDIUM' ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            style={{ width: `${verdict.confidence}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">{verdict.confidence}% confidence</span>
      </div>
    </div>
  );
};

const MessageBubble = ({ msg, isStreaming }) => {
  const isUser = msg.role === 'user';
  const displayText = isUser ? msg.content : stripVerdict(msg.content);
  const verdict = isUser ? null : parseVerdict(msg.content);

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0 mt-0.5">
          <Bot size={14} className="text-sky-400" />
        </div>
      )}

      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {isUser ? (
          <div className="bg-sky-500/20 border border-sky-500/25 rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[13px] text-white leading-relaxed">
            {displayText}
          </div>
        ) : (
          <div className="rounded-2xl rounded-tl-sm px-3.5 py-3 bg-white/[0.04] border border-white/[0.07] text-[13px] leading-relaxed">
            <div className="text-slate-300" dangerouslySetInnerHTML={{ __html: formatText(displayText) }} />
            {isStreaming && <span className="inline-block w-1.5 h-3.5 bg-sky-400 animate-pulse rounded-sm ml-0.5 align-middle" />}
            {verdict && !isStreaming && <VerdictBadge verdict={verdict} />}
          </div>
        )}
        <span className="text-[10px] text-slate-700 mt-1 px-1">{msg.timestamp}</span>
      </div>
    </div>
  );
};

const SUGGESTIONS = [
  { label: 'Is Bitcoin safe now?', query: 'Is Bitcoin safe to invest in right now? Check latest news and political climate.' },
  { label: 'Ethereum risk check', query: 'Analyze Ethereum. What are the risks right now? Any regulatory news?' },
  { label: 'Best crypto this week?', query: 'Which crypto coins are showing the best momentum and lowest risk this week?' },
  { label: 'War/crisis impact?', query: 'How are current geopolitical conflicts and global crises affecting the crypto market?' },
  { label: 'Trump crypto stance?', query: 'What is Trump\'s current stance on crypto and how does it affect Bitcoin and altcoins?' },
  { label: 'Solana outlook', query: 'Analyze Solana right now. Growth trend, risks, and should I invest?' },
];

export default function CryptoChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Prevent page scroll when chat is open on mobile
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, isMobile]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Global event listener to open chat and pre-fill message
  useEffect(() => {
    const handleOpenChat = (e) => {
      setIsOpen(true);
      if (e.detail?.message) {
        setTimeout(() => {
          setInput(e.detail.message);
          // Optional: automatically focus input when populated
          setTimeout(() => inputRef.current?.focus(), 50);
        }, 300); // give time for chat to open
      }
    };

    window.addEventListener('open-crypto-chat', handleOpenChat);
    return () => window.removeEventListener('open-crypto-chat', handleOpenChat);
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome = {
        role: 'assistant',
        content: `Hey! I'm **Kryonex AI** — your professional crypto analyst.\n\nAsk me about **any coin** and I'll check:\n- Latest news & political events\n- Price trends (24h / 7d / 1yr)\n- Geopolitical & macro factors\n- War/crisis impact on crypto\n- Whether it's safe to invest right now\n\nJust type a coin name or ask me anything.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([welcome]);
    }
  }, [isOpen, messages.length]);

  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim() || isLoading) return;
    setShowSuggestions(false);

    const userMsg = {
      role: 'user',
      content: userText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const historyMessages = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: stripVerdict(m.content) }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const assistantMsg = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      streaming: true,
    };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      abortRef.current = new AbortController();

      // If a Groq API key is provided in the frontend env, call Groq directly.
      // Otherwise fall back to the backend proxy route.
      let data;
      if (GROQ_API_KEY) {
        const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
          },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            max_tokens: 1500,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...historyMessages,
              { role: 'user', content: userText.trim() },
            ],
          }),
        });

        if (!groqResp.ok) {
          const err = await groqResp.json().catch(() => ({}));
          throw new Error(err?.error?.message || `API error ${groqResp.status}`);
        }

        data = await groqResp.json();
      } else {
        const response = await fetch(`${API_BASE_URL}/ai/crypto-chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            messages: [...historyMessages, { role: 'user', content: userText.trim() }],
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.error?.message || `API error ${response.status}`);
        }

        data = await response.json();
      }

      const content = data?.content || data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content,
          streaming: false,
        };
        return updated;
      });

      if (!isOpen) setHasUnread(true);
    } catch (err) {
      if (err.name === 'AbortError') return;
      const errMsg = err.message || 'Something went wrong. Please try again.';
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: `⚠️ ${errMsg}`,
          streaming: false,
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, isOpen]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (query) => {
    sendMessage(query);
  };

  const clearChat = () => {
    setMessages([]);
    setShowSuggestions(true);
    setIsOpen(false);
    setTimeout(() => setIsOpen(true), 50);
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsLoading(false);
    setMessages((prev) => {
      const updated = [...prev];
      if (updated[updated.length - 1]?.streaming) {
        updated[updated.length - 1] = { ...updated[updated.length - 1], streaming: false };
      }
      return updated;
    });
  };

  const lastMsg = messages[messages.length - 1];
  const isStreaming = lastMsg?.streaming;

  return (
    <>
      <div
        className="fixed z-[1000]"
        style={{
          bottom: 24,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'end',
          gap: 12
        }}
      >
        {!isOpen && messages.length === 0 && (
          <div className="animate-fadeSlideUp bg-[#0f1923] border border-sky-500/25 rounded-xl px-3.5 py-2.5 shadow-xl shadow-black/40 max-w-[200px]">
            <p className="text-white text-xs font-medium leading-snug">Ask AI about any crypto coin 🔍</p>
            <p className="text-slate-500 text-[11px] mt-0.5">Risk analysis · News · Trends</p>
          </div>
        )}

        <button
          onClick={() => setIsOpen((v) => !v)}
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          className="active:scale-90 hover:scale-105"
          aria-label="Open Crypto AI Analyst"
        >
          {isOpen ? <ChevronDown size={24} color="#fff" /> : <Bot size={24} color="#fff" />}
          {hasUnread && !isOpen && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-[#0d1f2d] animate-bounce" />}
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed z-[999] flex flex-col overflow-hidden animate-chatOpen"
          style={{
            ...(isMobile ? {
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              borderRadius: 0,
            } : {
              bottom: 84,
              right: 16,
              width: 380,
              height: 600,
              maxHeight: 'calc(100vh - 120px)',
              borderRadius: 20,
            }),
            background: '#0a1520',
            border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
          }}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.07] bg-white/[0.02] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#38bdf8] to-[#6366f1] flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white text-[15px] font-bold leading-none">Kryonex AI</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    {isStreaming ? 'Thinking...' : providerLabel}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                title="Reset Chat"
              >
                <RefreshCw size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all text-xl font-light"
              >
                ✕
              </button>
            </div>
          </div>

          {/* MESSAGES */}
          <div
            className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scrollbar-thin overscroll-contain"
            style={{ minHeight: 0 }}
          >
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              const displayText = isUser ? msg.content : stripVerdict(msg.content);
              const verdict = isUser ? null : parseVerdict(msg.content);

              return (
                <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div
                      className={`px-4 py-3 text-[14px] leading-relaxed shadow-sm ${isUser
                          ? 'bg-gradient-to-br from-[#38bdf8] to-[#6366f1] text-white rounded-2xl rounded-tr-sm'
                          : 'bg-white/[0.04] border border-white/[0.07] text-slate-200 rounded-2xl rounded-tl-sm'
                        }`}
                      style={{ wordBreak: 'break-word' }}
                    >
                      <div dangerouslySetInnerHTML={{ __html: isUser ? displayText : formatText(displayText) }} />
                      {isStreaming && i === messages.length - 1 && !isUser && (
                        <span className="inline-block w-1.5 h-3.5 bg-sky-400 animate-pulse rounded-sm ml-1 align-middle" />
                      )}
                      {verdict && !isStreaming && i === messages.length - 1 && <VerdictBadge verdict={verdict} />}
                    </div>
                    <span className="text-[9px] text-slate-600 px-1 font-medium">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* QUICK SUGGESTIONS */}
          {showSuggestions && messages.length === 1 && (
            <div className="px-4 py-2 flex-shrink-0">
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(s.query)}
                    className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400 hover:text-sky-300 hover:border-sky-500/30 hover:bg-sky-500/5 transition-all whitespace-nowrap"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className="flex-shrink-0 bg-[#0a1824]/50">
            <div className="px-4 py-1 border-t border-white/[0.04]">
              <p className="text-[9px] text-slate-700 text-center uppercase tracking-tighter">AI analysis only · Not financial advice · Always DYOR</p>
            </div>

            <div
              className="px-4 py-4 pt-2"
              style={{
                paddingBottom: isMobile ? 'max(16px, env(safe-area-inset-bottom))' : 16
              }}
            >
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder="Ask CryptoSense..."
                    rows={1}
                    style={{ minHeight: 44, maxHeight: 100 }}
                    className="w-full bg-white/[0.05] border border-white/[0.1] focus:border-sky-500/40 rounded-xl px-4 py-3 text-[14px] text-white placeholder-slate-600 resize-none outline-none transition-all scrollbar-none"
                  />
                </div>

                <button
                  onClick={isStreaming ? stopStreaming : handleSubmit}
                  disabled={!isStreaming && !input.trim()}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: isStreaming ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg, #38bdf8, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isStreaming ? '1px solid rgba(239,68,68,0.2)' : 'none',
                    cursor: 'pointer'
                  }}
                  className="active:scale-90 transition-all shrink-0"
                >
                  {isStreaming ? (
                    <X size={18} className="text-red-400" />
                  ) : (
                    <Send size={18} className="text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatOpen {
          from { opacity: 0; transform: ${isMobile ? 'translateY(100%)' : 'translateY(24px) scale(0.95)'}; }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-chatOpen  { animation: chatOpen 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeSlideUp { animation: fadeSlideUp 0.4s ease-out forwards; }
        .scrollbar-thin::-webkit-scrollbar { width: 3px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 2px; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}