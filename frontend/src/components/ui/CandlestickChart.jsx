import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import API_BASE_URL from '../../config/api';
import { formatPrice as smartFormatPrice } from '../../utils/formatPrice';

const CRYPTO_SYMBOLS = {
    bitcoin: 'BTC',
    btc: 'BTC',
    ethereum: 'ETH',
    eth: 'ETH',
    solana: 'SOL',
    sol: 'SOL',
    dogecoin: 'DOGE',
    doge: 'DOGE',
    shiba: 'SHIB',
    shib: 'SHIB',
    bnb: 'BNB',
    ada: 'ADA',
    dot: 'DOT',
};

const historyCache = new Map();
const MAX_HISTOGRAM_VALUE = 90071992547409.91;

const normalizeAsset = (assetId = '') => String(assetId).trim();

const getCryptoSymbol = (assetId = '') => {
    const normalized = normalizeAsset(assetId).toLowerCase();
    if (normalized.endsWith('usdt')) return normalized.toUpperCase();
    if (CRYPTO_SYMBOLS[normalized]) return `${CRYPTO_SYMBOLS[normalized]}USDT`;
    return `${normalizeAsset(assetId).toUpperCase()}USDT`;
};

const formatPrice = (price) => {
    return smartFormatPrice(price);
};

const parseNumber = (value, fallback = 0) => {
    const numeric = Number.parseFloat(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

const parseCryptoCandle = (item) => ({
    time: Math.floor(Number(item[0]) / 1000),
    open: parseNumber(item[1]),
    high: parseNumber(item[2]),
    low: parseNumber(item[3]),
    close: parseNumber(item[4]),
    volume: parseNumber(item[5]),
});

function merge15mTo45m(candles) {
    const merged = [];

    for (let index = 0; index + 2 < candles.length; index += 3) {
        merged.push({
            time: candles[index].time,
            open: candles[index].open,
            high: Math.max(candles[index].high, candles[index + 1].high, candles[index + 2].high),
            low: Math.min(candles[index].low, candles[index + 1].low, candles[index + 2].low),
            close: candles[index + 2].close,
            volume: candles[index].volume + candles[index + 1].volume + candles[index + 2].volume,
        });
    }

    return merged;
}

const CRYPTO_TIMEFRAMES = {
    '1MIN': { interval: '1m', limit: 60, startOffset: 60 * 60 * 1000 },
    '5MIN': { interval: '5m', limit: 72, startOffset: 6 * 60 * 60 * 1000 },
    '15MIN': { interval: '15m', limit: 96, startOffset: 24 * 60 * 60 * 1000 },
    '30MIN': { interval: '30m', limit: 96, startOffset: 2 * 24 * 60 * 60 * 1000 },
    '45MIN': { interval: '15m', limit: 288, startOffset: 3 * 24 * 60 * 60 * 1000, transform: merge15mTo45m, streamInterval: '15m' },
    '1D': { interval: '1h', limit: 24, startOffset: 24 * 60 * 60 * 1000 },
    '1W': { interval: '4h', limit: 42, startOffset: 7 * 24 * 60 * 60 * 1000 },
    '1M': { interval: '1d', limit: 30, startOffset: 30 * 24 * 60 * 60 * 1000 },
    '1Y': { interval: '1w', limit: 52, startOffset: 365 * 24 * 60 * 60 * 1000 },
};

const upsertCandle = (candles, candle) => {
    if (!candle?.time) return candles;

    const next = [...candles];
    const last = next[next.length - 1];

    if (!last) return [candle];
    if (last.time === candle.time) {
        next[next.length - 1] = candle;
    } else if (candle.time > last.time) {
        next.push(candle);
    }

    return next;
};

const getCryptoTimeframeConfig = (timeframe) => CRYPTO_TIMEFRAMES[timeframe] || CRYPTO_TIMEFRAMES['1M'];

const getVolumeScale = (candles) => {
    const maxVolume = candles.reduce((max, candle) => Math.max(max, Math.abs(Number(candle.volume) || 0)), 0);
    if (!Number.isFinite(maxVolume) || maxVolume <= MAX_HISTOGRAM_VALUE) return 1;
    return Math.ceil(maxVolume / MAX_HISTOGRAM_VALUE);
};

const normalizeVolume = (volume, scale = 1) => {
    const value = Math.abs(Number(volume) || 0) / Math.max(scale, 1);
    return Math.min(value, MAX_HISTOGRAM_VALUE);
};

const calculateSma = (candles, period = 9) => {
    const output = [];
    for (let index = 0; index < candles.length; index += 1) {
        if (index < period - 1) continue;
        const window = candles.slice(index - period + 1, index + 1);
        const average = window.reduce((sum, candle) => sum + candle.close, 0) / period;
        output.push({ time: candles[index].time, value: average });
    }
    return output;
};

const calculateEma = (candles, period = 9) => {
    if (!candles.length) return [];

    const multiplier = 2 / (period + 1);
    const output = [];
    let ema = candles[0].close;

    candles.forEach((candle, index) => {
        if (index === 0) {
            ema = candle.close;
        } else {
            ema = (candle.close - ema) * multiplier + ema;
        }

        if (index >= period - 1) {
            output.push({ time: candle.time, value: ema });
        }
    });

    return output;
};

const generateFallbackCandles = (assetSymbol, timeframe) => {
    const seedBase = Array.from(String(assetSymbol)).reduce((sum, char) => sum + char.charCodeAt(0), 0) + String(timeframe).length;
    const basePrice = String(assetSymbol).toLowerCase().includes('btc') ? 79314 : String(assetSymbol).toLowerCase().includes('eth') ? 3400 : 140;
    const now = Math.floor(Date.now() / 1000);
    const step = basePrice * 0.01;
    const candleCount = CRYPTO_TIMEFRAMES[timeframe]?.limit || 30;

    return Array.from({ length: candleCount }, (_, index) => {
        const wave = Math.sin((seedBase + index) / 3) * step * 2.2;
        const drift = ((index - candleCount / 2) / candleCount) * step * 8;
        const close = Math.max(basePrice + wave + drift, basePrice * 0.1);
        const open = Math.max(close + Math.sin(seedBase + index) * step * 0.4, basePrice * 0.1);
        const high = Math.max(open, close) + step * 0.75;
        const low = Math.max(Math.min(open, close) - step * 0.75, basePrice * 0.05);

        return {
            time: now - (candleCount - index) * 60,
            open,
            high,
            low,
            close,
            volume: Math.abs(Math.sin(seedBase + index)) * 1000000,
        };
    });
};

const tryBackendWebSocket = (topic, onLiveUpdate, onFallback) => {
    let wsUrl = API_BASE_URL.replace(/^http/, 'ws').replace(/\/api\/?$/, '/ws');
    if (import.meta.env.VITE_WS_URL) {
        wsUrl = import.meta.env.VITE_WS_URL;
    }
    
    let hasFailed = false;

    try {
        console.log(`Connecting to backend WebSocket Gateway: ${wsUrl}`);
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            if (hasFailed) return;
            console.log(`✅ Connected to backend WS. Subscribing to: ${topic}`);
            ws.send(JSON.stringify({ action: 'subscribe', topic }));
        };

        ws.onmessage = (event) => {
            if (hasFailed) return;
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'live' && message.topic === topic && message.data) {
                    onLiveUpdate(message.data);
                }
            } catch (e) {
                console.error('Error parsing backend WS message:', e);
            }
        };

        ws.onerror = (err) => {
            if (hasFailed) return;
            console.warn('Backend WS error:', err);
            hasFailed = true;
            ws.close();
            onFallback();
        };

        ws.onclose = () => {
            if (hasFailed) return;
            console.warn('Backend WS connection closed. Running fallback...');
            hasFailed = true;
            onFallback();
        };

        return ws;
    } catch (err) {
        console.warn('Failed to initialize backend WS connection:', err);
        hasFailed = true;
        onFallback();
        return null;
    }
};

const CandlestickChart = ({
    symbol,
    assetId,
    timeframe = '1D',
    height = 400,
    showVolume = true,
    indicators = { sma: false, ema: false },
    onCrosshairMove = null,
    onPriceUpdate = null,
}) => {
    const onPriceUpdateRef = useRef(onPriceUpdate);

    useEffect(() => {
        onPriceUpdateRef.current = onPriceUpdate;
    }, [onPriceUpdate]);

    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const candleSeriesRef = useRef(null);
    const volumeSeriesRef = useRef(null);
    const smaSeriesRef = useRef(null);
    const emaSeriesRef = useRef(null);
    const wsRef = useRef(null);
    const resizeObserverRef = useRef(null);
    const fitContentRef = useRef(false);
    const requestIdRef = useRef(0);
    const volumeScaleRef = useRef(1);
    const rawCryptoCandlesRef = useRef([]);
    const [candles, setCandles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    
    const assetSymbol = useMemo(() => normalizeAsset(symbol || assetId || ''), [symbol, assetId]);
    const historyCacheKey = useMemo(() => `crypto:${assetSymbol}:${timeframe}`, [assetSymbol, timeframe]);
    const priceFormatter = useMemo(() => (priceValue) => formatPrice(priceValue), []);

    useEffect(() => {
        fitContentRef.current = false;
    }, [historyCacheKey]);

    useEffect(() => {
        if (!chartContainerRef.current) return undefined;

        const initialWidth = chartContainerRef.current.clientWidth || Math.max(320, Math.floor(window.innerWidth * 0.9));
        const chart = createChart(chartContainerRef.current, {
            width: initialWidth,
            height,
            layout: {
                background: { color: '#0a0a0a' },
                textColor: '#94a3b8',
                fontFamily: 'Inter, sans-serif',
            },
            grid: {
                vertLines: { color: '#1a1a1a' },
                horzLines: { color: '#1a1a1a' },
            },
            crosshair: {
                mode: 1,
                vertLine: {
                    color: '#2a2a2a',
                    width: 1,
                    style: 3,
                    labelBackgroundColor: '#26a69a',
                },
                horzLine: {
                    color: '#2a2a2a',
                    width: 1,
                    style: 3,
                    labelBackgroundColor: '#26a69a',
                },
            },
            rightPriceScale: {
                autoScale: true,
                borderColor: '#1a1a1a',
            },
            timeScale: {
                borderColor: '#1a1a1a',
                timeVisible: true,
                secondsVisible: false,
            },
            localization: {
                priceFormatter,
            },
        });

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderUpColor: '#26a69a',
            borderDownColor: '#ef5350',
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });
        candleSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.05,
                bottom: showVolume ? 0.2 : 0.05,
            },
        });

        const volumeSeries = showVolume
            ? chart.addSeries(HistogramSeries, {
                color: 'rgba(38, 166, 154, 0.35)',
                priceFormat: { type: 'volume' },
                priceScaleId: 'volume',
                scaleMargins: {
                    top: 0.8,
                    bottom: 0,
                },
            })
            : null;
        if (volumeSeries) {
            volumeSeries.priceScale().applyOptions({
                scaleMargins: {
                    top: 0.8,
                    bottom: 0,
                },
            });
        }

        const smaSeries = chart.addSeries(LineSeries, {
            color: '#f59e0b',
            lineWidth: 1.5,
        });

        const emaSeries = chart.addSeries(LineSeries, {
            color: '#3b82f6',
            lineWidth: 1.5,
        });

        chartRef.current = chart;
        candleSeriesRef.current = candleSeries;
        volumeSeriesRef.current = volumeSeries;
        smaSeriesRef.current = smaSeries;
        emaSeriesRef.current = emaSeries;

        if (onCrosshairMove) {
            chart.subscribeCrosshairMove(onCrosshairMove);
        }

        resizeObserverRef.current = new ResizeObserver(() => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: Math.max(320, chartContainerRef.current.clientWidth || Math.floor(window.innerWidth * 0.9)),
                });
            }
        });

        resizeObserverRef.current.observe(chartContainerRef.current);

        return () => {
            if (onCrosshairMove) {
                chart.unsubscribeCrosshairMove(onCrosshairMove);
            }

            resizeObserverRef.current?.disconnect();
            resizeObserverRef.current = null;
            chart.remove();
            chartRef.current = null;
            candleSeriesRef.current = null;
            volumeSeriesRef.current = null;
            smaSeriesRef.current = null;
            emaSeriesRef.current = null;
        };
    }, [height, priceFormatter, showVolume, onCrosshairMove]);

    useEffect(() => {
        const cleanupRealtime = () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };

        const isStaleRequest = (requestId) => requestId !== requestIdRef.current;

        const fetchHistoricalCandles = async () => {
            if (!assetSymbol) {
                setCandles([]);
                setErrorMessage('No chart data available for this asset');
                setIsLoading(false);
                return;
            }

            const requestId = requestIdRef.current + 1;
            requestIdRef.current = requestId;
            setIsLoading(true);
            setErrorMessage('');
            cleanupRealtime();
            fitContentRef.current = false;

            const cachedCandles = historyCache.get(historyCacheKey);
            if (cachedCandles?.length) {
                if (isStaleRequest(requestId)) return;
                setCandles(cachedCandles);
                onPriceUpdate?.(cachedCandles.at(-1)?.close);
            }

            try {
                const cryptoSymbol = getCryptoSymbol(assetSymbol);
                const timeframeConfig = getCryptoTimeframeConfig(timeframe);
                const endTime = Date.now();
                const startTime = endTime - (timeframeConfig.startOffset || 30 * 24 * 60 * 60 * 1000);
                const response = await fetch(
                    `https://api.binance.com/api/v3/klines?symbol=${cryptoSymbol}&interval=${timeframeConfig.interval}&limit=${timeframeConfig.limit}&startTime=${startTime}&endTime=${endTime}`
                );

                if (!response.ok) {
                    throw new Error(`Binance request failed: ${response.status}`);
                }

                const payload = await response.json();
                const parsedCandles = Array.isArray(payload)
                    ? payload.map(parseCryptoCandle)
                    : [];

                if (isStaleRequest(requestId)) return;

                if (!parsedCandles.length) {
                    setErrorMessage(`No chart data available for ${assetSymbol}`);
                }

                const rawCandles = parsedCandles.length > 0 ? parsedCandles : generateFallbackCandles(assetSymbol, timeframe);
                const nextCandles = typeof timeframeConfig.transform === 'function' ? timeframeConfig.transform(rawCandles) : rawCandles;
                rawCryptoCandlesRef.current = rawCandles;
                volumeScaleRef.current = getVolumeScale(nextCandles);
                historyCache.set(historyCacheKey, nextCandles);
                setCandles(nextCandles);
                onPriceUpdateRef.current?.(nextCandles.at(-1)?.close);

                const streamInterval = timeframeConfig.streamInterval || timeframeConfig.interval;
                const startCryptoLiveStream = () => {
                    try {
                        wsRef.current = new WebSocket(
                            `wss://stream.binance.com:9443/ws/${cryptoSymbol.toLowerCase()}@kline_${streamInterval}`
                        );

                        wsRef.current.onmessage = (event) => {
                            try {
                                if (isStaleRequest(requestId)) return;

                                const message = JSON.parse(event.data);
                                const kline = message?.k;
                                if (!kline) return;

                                const liveCandle = {
                                    time: Math.floor(Number(kline.t) / 1000),
                                    open: parseNumber(kline.o),
                                    high: parseNumber(kline.h),
                                    low: parseNumber(kline.l),
                                    close: parseNumber(kline.c),
                                    volume: parseNumber(kline.v),
                                };

                                if (typeof timeframeConfig.transform === 'function') {
                                    const nextRawCandles = upsertCandle(rawCryptoCandlesRef.current, liveCandle);
                                    rawCryptoCandlesRef.current = nextRawCandles;
                                    const nextCandles = timeframeConfig.transform(nextRawCandles);
                                    volumeScaleRef.current = getVolumeScale(nextCandles);
                                    setCandles(nextCandles);
                                    onPriceUpdateRef.current?.(nextCandles.at(-1)?.close);
                                } else {
                                    candleSeriesRef.current?.update(liveCandle);
                                    if (volumeSeriesRef.current) {
                                        volumeSeriesRef.current.update({
                                            time: liveCandle.time,
                                            value: normalizeVolume(liveCandle.volume || 0, volumeScaleRef.current),
                                            color: liveCandle.close >= liveCandle.open ? 'rgba(38, 166, 154, 0.35)' : 'rgba(239, 83, 80, 0.35)',
                                        });
                                    }
                                    onPriceUpdateRef.current?.(liveCandle.close);

                                    setCandles((previous) => {
                                        if (isStaleRequest(requestId)) return previous;

                                        return upsertCandle(previous, liveCandle);
                                    });
                                }
                            } catch (error) {
                                console.error('Binance websocket parse error:', error);
                            }
                        };

                        wsRef.current.onerror = (error) => {
                            console.error('Binance websocket error:', error);
                        };
                    } catch (err) {
                        console.error('Binance websocket init error:', err);
                    }
                };

                const handleLiveUpdate = (liveCandle) => {
                    if (isStaleRequest(requestId)) return;
                    if (typeof timeframeConfig.transform === 'function') {
                        const nextRawCandles = upsertCandle(rawCryptoCandlesRef.current, liveCandle);
                        rawCryptoCandlesRef.current = nextRawCandles;
                        const nextCandles = timeframeConfig.transform(nextRawCandles);
                        volumeScaleRef.current = getVolumeScale(nextCandles);
                        setCandles(nextCandles);
                        onPriceUpdateRef.current?.(nextCandles.at(-1)?.close);
                    } else {
                        candleSeriesRef.current?.update(liveCandle);
                        if (volumeSeriesRef.current) {
                            volumeSeriesRef.current.update({
                                time: liveCandle.time,
                                value: normalizeVolume(liveCandle.volume || 0, volumeScaleRef.current),
                                color: liveCandle.close >= liveCandle.open ? 'rgba(38, 166, 154, 0.35)' : 'rgba(239, 83, 80, 0.35)',
                            });
                        }
                        onPriceUpdateRef.current?.(liveCandle.close);

                        setCandles((previous) => {
                            if (isStaleRequest(requestId)) return previous;
                            return upsertCandle(previous, liveCandle);
                        });
                    }
                };

                // Try backend WS gateway first, fallback to direct Binance stream
                wsRef.current = tryBackendWebSocket(
                    `crypto:${cryptoSymbol}`,
                    handleLiveUpdate,
                    () => {
                        if (isStaleRequest(requestId)) return;
                        startCryptoLiveStream();
                    }
                );
            } catch (error) {
                if (isStaleRequest(requestId)) return;

                console.error('Failed to load historical candles:', error);
                setErrorMessage(`Failed to load chart for ${assetSymbol}`);
                const fallbackCandles = generateFallbackCandles(assetSymbol, timeframe);
                historyCache.set(historyCacheKey, fallbackCandles);
                setCandles(fallbackCandles);
                onPriceUpdate?.(fallbackCandles.at(-1)?.close);
            } finally {
                if (isStaleRequest(requestId)) return;

                setIsLoading(false);
            }
        };

        fetchHistoricalCandles();

        return () => {
            requestIdRef.current += 1;
            cleanupRealtime();
        };
    }, [assetSymbol, timeframe, historyCacheKey]);

    useEffect(() => {
        if (!chartRef.current || !candleSeriesRef.current || candles.length === 0) return;

        const candleData = candles.map((candle) => ({
            time: candle.time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
        }));

        candleSeriesRef.current.setData(candleData);

        if (volumeSeriesRef.current && showVolume) {
            volumeSeriesRef.current.setData(candles.map((candle) => ({
                time: candle.time,
                value: normalizeVolume(candle.volume || 0, volumeScaleRef.current),
                color: candle.close >= candle.open ? 'rgba(38, 166, 154, 0.35)' : 'rgba(239, 83, 80, 0.35)',
            })));
        }

        if (indicators.sma && smaSeriesRef.current) {
            smaSeriesRef.current.setData(calculateSma(candles));
        } else if (smaSeriesRef.current) {
            smaSeriesRef.current.setData([]);
        }

        if (indicators.ema && emaSeriesRef.current) {
            emaSeriesRef.current.setData(calculateEma(candles));
        } else if (emaSeriesRef.current) {
            emaSeriesRef.current.setData([]);
        }

        if (!fitContentRef.current) {
            chartRef.current.timeScale().fitContent();
            fitContentRef.current = true;
        }
    }, [candles, indicators, showVolume]);

    return (
        <div className="relative w-full" style={{ height: `${height}px` }}>
            <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                    Live
                </span>
            </div>
            {isLoading && candles.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/80 z-10 backdrop-blur-sm rounded-xl border border-white/5">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                </div>
            )}
            <div ref={chartContainerRef} className="w-full h-full rounded-xl overflow-hidden" />
            {!isLoading && errorMessage && candles.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/75 text-slate-300 text-sm rounded-xl border border-white/5 px-4 text-center">
                    {errorMessage}
                </div>
            )}
        </div>
    );
};

export default CandlestickChart;
