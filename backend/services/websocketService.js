const WebSocket = require('ws');
const logger = require('./loggerService');

class WebSocketService {
    constructor() {
        this.wss = null;
        this.clients = new Map(); // ws client -> Set of subscribed topics
        this.topicSubscribers = new Map(); // topic -> Set of ws clients

        // Crypto WebSocket connections (symbol:interval -> ws connection to Binance)
        this.binanceConnections = new Map();
        this.reconnectAttempts = new Map();
        this.reconnectTimers = new Map();
        this.intentionalBinanceClosures = new Set();
        this.cryptoIntervals = new Set([
            '1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h',
            '6h', '8h', '12h', '1d', '3d', '1w', '1M',
        ]);
    }

    /**
     * Initialize WebSocket server bound to Express HTTP server
     */
    init(server) {
        this.wss = new WebSocket.Server({ noServer: true });

        server.on('upgrade', (request, socket, head) => {
            const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
            
            if (pathname === '/ws' || pathname === '/ws/') {
                this.wss.handleUpgrade(request, socket, head, (ws) => {
                    this.wss.emit('connection', ws, request);
                });
            } else {
                socket.destroy();
            }
        });

        this.wss.on('connection', (ws) => {
            logger.info('WebSocket client connected to gateway');
            this.clients.set(ws, new Set());

            ws.on('message', (message) => {
                this.handleMessage(ws, message);
            });

            ws.on('close', () => {
                logger.info('WebSocket client disconnected');
                this.handleDisconnect(ws);
            });

            ws.on('error', (err) => {
                logger.error(`WebSocket client error: ${err.message}`);
                this.handleDisconnect(ws);
            });
        });

        logger.info('WebSocket unified gateway initialized on path /ws');
    }

    /**
     * Handle incoming client messages
     */
    handleMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            const { action, topic } = data;

            if (!action || !topic) {
                ws.send(JSON.stringify({ error: 'Invalid format. "action" and "topic" are required.' }));
                return;
            }

            if (action === 'subscribe') {
                const topicParts = this.parseCryptoTopic(topic);
                if (topicParts?.error) {
                    ws.send(JSON.stringify({ error: topicParts.error }));
                    return;
                }
                this.subscribe(ws, topic);
            } else if (action === 'unsubscribe') {
                this.unsubscribe(ws, topic);
            } else {
                ws.send(JSON.stringify({ error: `Unknown action: ${action}` }));
            }
        } catch (err) {
            logger.error(`Failed to parse WebSocket message: ${err.message}`);
            ws.send(JSON.stringify({ error: 'Failed to parse message. Must be valid JSON.' }));
        }
    }

    /**
     * Subscribe a client to a topic
     */
    subscribe(ws, topic) {
        logger.info(`Client subscribing to: ${topic}`);
        
        // Register connection
        this.clients.get(ws).add(topic);
        if (!this.topicSubscribers.has(topic)) {
            this.topicSubscribers.set(topic, new Set());
        }
        this.topicSubscribers.get(topic).add(ws);

        // Start ingestion pipeline if this is the first subscriber
        if (this.topicSubscribers.get(topic).size === 1) {
            this.startIngestion(topic);
        }

        // Send initial confirmation
        ws.send(JSON.stringify({ type: 'subscribed', topic }));
    }

    /**
     * Unsubscribe a client from a topic
     */
    unsubscribe(ws, topic) {
        logger.info(`Client unsubscribing from: ${topic}`);

        const clientTopics = this.clients.get(ws);
        if (clientTopics) {
            clientTopics.delete(topic);
        }

        const subscribers = this.topicSubscribers.get(topic);
        if (subscribers) {
            subscribers.delete(ws);
            if (subscribers.size === 0) {
                this.topicSubscribers.delete(topic);
                this.stopIngestion(topic);
            }
        }
    }

    /**
     * Handle client disconnection
     */
    handleDisconnect(ws) {
        const subscribedTopics = this.clients.get(ws);
        if (subscribedTopics) {
            for (const topic of subscribedTopics) {
                const subscribers = this.topicSubscribers.get(topic);
                if (subscribers) {
                    subscribers.delete(ws);
                    if (subscribers.size === 0) {
                        this.topicSubscribers.delete(topic);
                        this.stopIngestion(topic);
                    }
                }
            }
        }
        this.clients.delete(ws);
    }

    /**
     * Start ingestion pipeline (multiplexing external feed) for a topic
     */
    startIngestion(topic) {
        const [assetType, symbol, interval = '1m'] = topic.split(':');
        if (!assetType || !symbol) return;

        logger.info(`Starting ingestion pipeline for topic: ${topic}`);

        if (assetType.toLowerCase() === 'crypto') {
            this.startCryptoFeed(symbol, interval, topic);
        } else {
            logger.warn(`Asset type not supported by websocket service: ${assetType}`);
        }
    }

    /**
     * Stop ingestion pipeline for a topic when there are no more subscribers
     */
    stopIngestion(topic) {
        const [assetType, symbol, interval = '1m'] = topic.split(':');
        if (!assetType || !symbol) return;

        logger.info(`Stopping ingestion pipeline for topic: ${topic}`);

        if (assetType.toLowerCase() === 'crypto') {
            const cleanSymbol = symbol.toUpperCase();
            const streamKey = `${cleanSymbol}:${interval}`;
            if (!this.hasCryptoSubscribers(streamKey, topic)) {
                const conn = this.binanceConnections.get(streamKey);
                if (conn) {
                    this.intentionalBinanceClosures.add(streamKey);
                    conn.close();
                    this.binanceConnections.delete(streamKey);
                    logger.info(`Closed Binance stream connection for: ${streamKey}`);
                }
                const reconnectTimer = this.reconnectTimers.get(streamKey);
                if (reconnectTimer) clearTimeout(reconnectTimer);
                this.reconnectTimers.delete(streamKey);
                this.reconnectAttempts.delete(streamKey);
            }
        }
    }

    /**
     * Ingestion pipeline: Binance WebSockets for Crypto
     */
    startCryptoFeed(symbol, interval, topic) {
        const cleanSymbol = symbol.toUpperCase();
        const streamKey = `${cleanSymbol}:${interval}`;
        // Check if already active
        if (this.binanceConnections.has(streamKey)) return;

        const binanceUrl = `wss://stream.binance.com:9443/ws/${cleanSymbol.toLowerCase()}@kline_${interval}`;
        logger.info(`Opening Binance WebSocket connection: ${binanceUrl}`);

        try {
            const binanceWs = new WebSocket(binanceUrl);

            binanceWs.on('open', () => {
                this.reconnectAttempts.delete(streamKey);
            });

            binanceWs.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    const kline = message?.k;
                    if (!kline) return;

                    const liveUpdate = {
                        time: Math.floor(Number(kline.t) / 1000),
                        open: parseFloat(kline.o),
                        high: parseFloat(kline.h),
                        low: parseFloat(kline.l),
                        close: parseFloat(kline.c),
                        volume: parseFloat(kline.v),
                    };

                    this.broadcastCryptoUpdate(streamKey, liveUpdate);
                } catch (e) {
                    logger.error(`Binance data parse error: ${e.message}`);
                }
            });

            binanceWs.on('error', (err) => {
                if (this.intentionalBinanceClosures.has(streamKey)) return;
                logger.error(`Binance stream connection error: ${err.message}`);
            });

            binanceWs.on('close', () => {
                const intentionalClose = this.intentionalBinanceClosures.delete(streamKey);
                logger.info(`Binance stream connection closed for ${streamKey}`);
                if (intentionalClose) return;
                // Reconnect if there are still subscribers
                const activeTopic = this.getCryptoTopicForStream(streamKey);
                if (activeTopic) {
                    this.binanceConnections.delete(streamKey);
                    const attempts = this.reconnectAttempts.get(streamKey) || 0;
                    if (attempts >= 3) {
                        const delay = 60000;
                        logger.warn(`Retrying Binance stream for ${streamKey} in ${delay}ms after ${attempts} failed attempts`);
                        const timer = setTimeout(() => {
                            this.reconnectTimers.delete(streamKey);
                            this.startCryptoFeed(symbol, interval, activeTopic);
                        }, delay);
                        this.reconnectTimers.set(streamKey, timer);
                        return;
                    }
                    const delay = Math.min(3000 * (2 ** attempts), 30000);
                    this.reconnectAttempts.set(streamKey, attempts + 1);
                    logger.info(`Reconnecting to Binance stream for ${streamKey} in ${delay}ms...`);
                    const timer = setTimeout(() => {
                        this.reconnectTimers.delete(streamKey);
                        this.startCryptoFeed(symbol, interval, activeTopic);
                    }, delay);
                    this.reconnectTimers.set(streamKey, timer);
                }
            });

            this.binanceConnections.set(streamKey, binanceWs);
        } catch (err) {
            logger.error(`Failed to connect to Binance socket: ${err.message}`);
        }
    }

    parseCryptoTopic(topic) {
        const [assetType, rawSymbol, interval = '1m', ...extra] = String(topic).split(':');
        if (assetType?.toLowerCase() !== 'crypto') return null;
        if (!rawSymbol || extra.length > 0) {
            return { error: 'Invalid crypto topic' };
        }

        const symbol = rawSymbol.toUpperCase();
        if (!/^[A-Z0-9]{2,15}$/.test(symbol)) {
            return { error: 'Invalid crypto symbol' };
        }
        if (!this.cryptoIntervals.has(interval)) {
            return { error: `Invalid crypto interval: ${interval}` };
        }

        return { symbol, interval };
    }

    getCryptoStreamKey(topic) {
        const parsed = this.parseCryptoTopic(topic);
        return parsed ? `${parsed.symbol}:${parsed.interval}` : null;
    }

    getCryptoTopicForStream(streamKey) {
        for (const [topic, subscribers] of this.topicSubscribers) {
            if (subscribers.size > 0 && this.getCryptoStreamKey(topic) === streamKey) {
                return topic;
            }
        }
        return null;
    }

    hasCryptoSubscribers(streamKey, excludedTopic = null) {
        for (const [topic, subscribers] of this.topicSubscribers) {
            if (topic !== excludedTopic && subscribers.size > 0 && this.getCryptoStreamKey(topic) === streamKey) {
                return true;
            }
        }
        return false;
    }

    broadcastCryptoUpdate(streamKey, data) {
        for (const [topic, subscribers] of this.topicSubscribers) {
            if (subscribers.size === 0 || this.getCryptoStreamKey(topic) !== streamKey) continue;
            this.broadcast(topic, {
                type: 'live',
                topic,
                data,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Broadcast message to all subscribers of a topic
     */
    broadcast(topic, message) {
        const subscribers = this.topicSubscribers.get(topic);
        if (!subscribers) return;

        const payload = JSON.stringify(message);
        for (const ws of subscribers) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(payload);
            }
        }
    }
}

module.exports = new WebSocketService();
