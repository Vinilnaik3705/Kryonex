/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from 'react';
import apiClient from '../lib/apiClient';

/**
 * Shared singleton price poller for /api/crypto/price/:symbol.
 *
 * Every component that needs a live price for a symbol calls
 *   const { price, data, stale, error } = useCryptoPrice('BTC');
 * Internally only ONE fetch loop per symbol runs, regardless of how many
 * components subscribe.
 *
 * Behaviour:
 * - Self-scheduling setTimeout (not setInterval) with in-flight guard.
 * - 8 s normal interval.
 * - Exponential back-off on failure: 16 → 32 → 60 s max; resets on success.
 * - Pauses when document.hidden and resumes on visibility change.
 * - Single console.warn per failure (no noisy console.error loops).
 * - AbortController per fetch, aborted when all subscribers leave.
 */

// ── Module-level singleton state ──────────────────────────────────────

const BASE_DELAY = 4_000;

/** @type {Map<string, SymbolEntry>} */
const symbols = new Map();

/**
 * @typedef {Object} SymbolEntry
 * @property {Set<Function>} listeners
 * @property {AbortController|null} controller
 * @property {number|null} timer
 * @property {boolean} inFlight
 * @property {number} delay
 * @property {{ data: object|null, price: number|null, stale: boolean, error: string|null }} state
 */

/** Create a fresh entry for a symbol. */
const createEntry = () => ({
    listeners: new Set(),
    controller: null,
    timer: null,
    inFlight: false,
    delay: BASE_DELAY,
    state: { data: null, price: null, stale: false, error: null },
});

// ── Visibility handling ───────────────────────────────────────────────

let documentHidden = typeof document !== 'undefined' ? document.hidden : false;

if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        const wasHidden = documentHidden;
        documentHidden = document.hidden;

        if (wasHidden && !documentHidden) {
            // Tab became visible → kick every idle symbol to poll immediately.
            for (const [sym, entry] of symbols) {
                if (entry.listeners.size > 0 && !entry.inFlight) {
                    schedulePoll(sym, 0);
                }
            }
        }
    });
}

// ── Core polling ──────────────────────────────────────────────────────

function schedulePoll(symbol, delay) {
    const entry = symbols.get(symbol);
    if (!entry) return;
    if (entry.timer !== null) clearTimeout(entry.timer);
    entry.timer = setTimeout(() => runPoll(symbol), delay);
}

async function runPoll(symbol) {
    const entry = symbols.get(symbol);
    if (!entry || entry.listeners.size === 0) return;
    if (entry.inFlight) return;
    if (documentHidden) return; // don't poll in the background

    entry.inFlight = true;
    entry.controller = new AbortController();

    try {
        const response = await apiClient.get(
            `/crypto/price/${encodeURIComponent(symbol)}`,
            { signal: entry.controller.signal },
        );

        const payload = response.data?.data || response.data || {};
        const price = Number(payload.price);
        const stale = !!payload.stale;

        entry.state = {
            data: payload,
            price: Number.isFinite(price) ? price : entry.state.price,
            stale,
            error: null,
        };
        entry.delay = BASE_DELAY; // reset back-off
        notify(entry);
    } catch (err) {
        if (err?.code === 'ERR_CANCELED') return; // intentional abort
        console.warn(`[useCryptoPrice] ${symbol} fetch failed:`, err?.message || err);
        entry.delay = Math.min(entry.delay * 2, 60_000);
        entry.state = { ...entry.state, error: err?.message || 'Fetch failed' };
        notify(entry);
    } finally {
        entry.inFlight = false;
        entry.controller = null;

        // Re-schedule only if subscribers remain.
        if (entry.listeners.size > 0) {
            schedulePoll(symbol, entry.delay);
        }
    }
}

function notify(entry) {
    for (const cb of entry.listeners) {
        try {
            cb(entry.state);
        } catch {
            /* subscriber threw — ignore */
        }
    }
}

function subscribe(symbol, callback) {
    if (!symbols.has(symbol)) {
        symbols.set(symbol, createEntry());
    }
    const entry = symbols.get(symbol);
    entry.listeners.add(callback);

    // Immediately deliver the current state (may be from a prior fetch).
    if (entry.state.price !== null) {
        try { callback(entry.state); } catch { /* */ }
    }

    // If this is the first subscriber, kick off polling.
    if (entry.listeners.size === 1 && !entry.inFlight) {
        schedulePoll(symbol, 0); // fetch immediately
    }
}

function unsubscribe(symbol, callback) {
    const entry = symbols.get(symbol);
    if (!entry) return;
    entry.listeners.delete(callback);

    if (entry.listeners.size === 0) {
        // No more subscribers — stop polling and abort any in-flight request.
        if (entry.timer !== null) clearTimeout(entry.timer);
        entry.timer = null;
        entry.controller?.abort();
        entry.delay = BASE_DELAY;
    }
}

// ── React hook ────────────────────────────────────────────────────────

/**
 * Subscribe to live price updates for a single crypto symbol.
 *
 * @param {string|null|undefined} symbol  e.g. 'BTC', 'ETH'
 * @returns {{ price: number|null, data: object|null, stale: boolean, error: string|null }}
 */
export default function useCryptoPrice(symbol) {
    const [state, setState] = useState(() => {
        if (!symbol) return { data: null, price: null, stale: false, error: null };
        const entry = symbols.get(symbol?.toUpperCase?.());
        return entry?.state || { data: null, price: null, stale: false, error: null };
    });

    const symbolRef = useRef(symbol);

    useEffect(() => {
        const sym = symbol?.toUpperCase?.();
        symbolRef.current = sym;
        if (!sym) {
            setState({ data: null, price: null, stale: false, error: null });
            return;
        }

        const handler = (next) => {
            if (symbolRef.current === sym) setState(next);
        };

        subscribe(sym, handler);

        return () => {
            unsubscribe(sym, handler);
        };
    }, [symbol]);

    return state;
}

/**
 * Imperative subscribe — used by CandlestickChart or other non-hook callers.
 * Returns an unsubscribe function.
 */
export function subscribeCryptoPrice(symbol, callback) {
    const sym = symbol?.toUpperCase?.();
    if (!sym) return () => {};
    subscribe(sym, callback);
    return () => unsubscribe(sym, callback);
}
