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
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-text-main font-semibold">$1</strong>')
    .replace(/^### (.+)$/gm, '<div class="text-brand-600 font-bold text-xs uppercase tracking-widest mt-3 mb-1">$1</div>')
    .replace(/^## (.+)$/gm, '<div class="text-text-main font-semibold text-sm mt-4 mb-1">$1</div>')
    .replace(/^# (.+)$/gm, '<div class="text-text-main font-bold text-base mt-4 mb-2">$1</div>')
    .replace(/^- (.+)$/gm, '<div class="flex gap-1.5 text-text-muted text-[13px] leading-relaxed"><span class="text-brand-500 mt-[3px] shrink-0">•</span><span>$1</span></div>')
    .replace(/\n\n/g, '<div class="h-2"></div>')
    .replace(/\n/g, '<br/>');
}

const providerLabel = 'AI Analyst';

const VerdictBadge = ({ verdict }) => {
  if (!verdict) return null;

  const riskCfg = {
    HIGH: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-600', icon: <AlertTriangle size={12} />, dot: 'bg-rose-500' },
    MEDIUM: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-600', icon: <Activity size={12} />, dot: 'bg-amber-500' },
    LOW: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-600', icon: <Shield size={12} />, dot: 'bg-emerald-500' },
  }[verdict.riskLevel] || { bg: 'bg-secondary border-border', text: 'text-text-muted', icon: <Minus size={12} />, dot: 'bg-text-dim' };

  const safeCfg = {
    YES: { label: 'Safe to Invest', color: 'text-emerald-600' },
    NO: { label: 'Avoid Now', color: 'text-rose-600' },
    CAUTION: { label: 'Proceed with Caution', color: 'text-amber-600' },
  }[verdict.safe] || { label: verdict.safe, color: 'text-text-muted' };

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
      <p className="text-text-main text-[13px] font-medium leading-snug">{verdict.oneLine}</p>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-hover">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${verdict.riskLevel === 'HIGH' ? 'bg-rose-500' : verdict.riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            style={{ width: `${verdict.confidence}%` }}
          />
        </div>
        <span className="text-xs text-text-dim font-medium">{verdict.confidence}% confidence</span>
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
        <div className="w-7 h-7 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 mt-0.5">
          <Bot size={14} className="text-brand-600" />
        </div>
      )}

      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {isUser ? (
          <div className="bg-brand-gradient rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[13px] text-white leading-relaxed">
            {displayText}
          </div>
        ) : (
          <div className="rounded-2xl rounded-tl-sm px-3.5 py-3 bg-hover border border-border text-[13px] leading-relaxed">
            <div className="text-text-muted" dangerouslySetInnerHTML={{ __html: formatText(displayText) }} />
            {isStreaming && <span className="inline-block w-1.5 h-3.5 bg-brand-500 animate-pulse rounded-sm ml-0.5 align-middle" />}
            {verdict && !isStreaming && <VerdictBadge verdict={verdict} />}
          </div>
        )}
        <span className="text-[10px] text-text-dim mt-1 px-1">{msg.timestamp}</span>
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

      let data = null;

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `API error ${response.status}`);
      }

      data = await response.json();

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
        {!isMobile && !isOpen && messages.length === 0 && (
          <div className="animate-fadeSlideUp surface-card rounded-xl px-3.5 py-2.5 shadow-card max-w-[200px]">
            <p className="text-text-main text-xs font-medium leading-snug">Ask AI about any crypto coin 🔍</p>
            <p className="text-text-dim text-[11px] mt-0.5">Risk analysis · News · Trends</p>
          </div>
        )}

        {!(isMobile && isOpen) && (
          <button
            onClick={() => setIsOpen((v) => !v)}
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px -6px rgba(99,102,241,0.5)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            className="active:scale-90 hover:scale-105 relative"
            aria-label="Open Crypto AI Analyst"
          >
            {isOpen ? <ChevronDown size={24} color="#fff" /> : <Bot size={24} color="#fff" />}
            {hasUnread && !isOpen && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-primary animate-bounce" />}
          </button>
        )}
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
              width: '100dvw',
              height: '100dvh',
              maxHeight: '100dvh',
              borderRadius: 0,
            } : {
              bottom: 88,
              right: 16,
              width: 380,
              height: 600,
              maxHeight: 'calc(100vh - 120px)',
              borderRadius: 20,
            }),
            background: 'var(--color-card)',
            border: isMobile ? 'none' : '1px solid var(--color-border)',
            boxShadow: '0 24px 64px -16px rgba(10,10,15,0.24), 0 0 0 1px rgba(99,102,241,0.06)',
          }}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-border bg-brand-gradient-soft flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-soft">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <p className="text-text-main text-[15px] font-bold leading-none font-heading">Kryonex AI</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">
                    {isStreaming ? 'Thinking...' : providerLabel}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-hover transition-all"
                title="Reset Chat"
              >
                <RefreshCw size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-hover transition-all text-xl font-light"
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
                          ? 'bg-brand-gradient text-white rounded-2xl rounded-tr-sm'
                          : 'bg-hover border border-border text-text-main rounded-2xl rounded-tl-sm'
                        }`}
                      style={{ wordBreak: 'break-word' }}
                    >
                      <div dangerouslySetInnerHTML={{ __html: isUser ? displayText : formatText(displayText) }} />
                      {isStreaming && i === messages.length - 1 && !isUser && (
                        <span className="inline-block w-1.5 h-3.5 bg-brand-500 animate-pulse rounded-sm ml-1 align-middle" />
                      )}
                      {verdict && !isStreaming && i === messages.length - 1 && <VerdictBadge verdict={verdict} />}
                    </div>
                    <span className="text-[9px] text-text-dim px-1 font-medium">{msg.timestamp}</span>
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
                    className="px-3 py-1.5 rounded-full bg-hover border border-border text-[11px] text-text-muted hover:text-brand-700 hover:border-brand-200 hover:bg-brand-50 transition-all whitespace-nowrap"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className="sticky bottom-0 z-10 flex-shrink-0 bg-primary/90 backdrop-blur-md">
            <div className="px-4 py-1 border-t border-border">
              <p className="text-[9px] text-text-dim text-center uppercase tracking-tighter">AI analysis only · Not financial advice · Always DYOR</p>
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
                    placeholder="Ask Kryonex AI..."
                    rows={1}
                    style={{ minHeight: 44, maxHeight: 100 }}
                    className="w-full bg-hover border border-border focus:border-brand-300 rounded-xl px-4 py-3 text-[14px] text-text-main placeholder-text-dim resize-none outline-none transition-all scrollbar-none"
                  />
                </div>

                <button
                  onClick={isStreaming ? stopStreaming : handleSubmit}
                  disabled={!isStreaming && !input.trim()}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: isStreaming ? 'rgba(244,63,94,0.12)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isStreaming ? '1px solid rgba(244,63,94,0.25)' : 'none',
                    cursor: 'pointer'
                  }}
                  className="active:scale-90 transition-all shrink-0"
                >
                  {isStreaming ? (
                    <X size={18} className="text-rose-500" />
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
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.15); border-radius: 2px; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}