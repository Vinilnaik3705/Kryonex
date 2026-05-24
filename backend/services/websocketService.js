const WebSocket = require('ws');
const logger = require('./loggerService');

class WebSocketService {
    constructor() {
        this.wss = null;
        this.clients = new Map(); // ws client -> Set of subscribed topics
        this.topicSubscribers = new Map(); // topic -> Set of ws clients

        // Crypto WebSocket connections (symbol -> ws connection to Binance)
        this.binanceConnections = new Map();
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
        const [assetType, symbol] = topic.split(':');
        if (!assetType || !symbol) return;

        logger.info(`Starting ingestion pipeline for topic: ${topic}`);

        if (assetType.toLowerCase() === 'crypto') {
            this.startCryptoFeed(symbol, topic);
        } else {
            logger.warn(`Asset type not supported by websocket service: ${assetType}`);
        }
    }

    /**
     * Stop ingestion pipeline for a topic when there are no more subscribers
     */
    stopIngestion(topic) {
        const [assetType, symbol] = topic.split(':');
        if (!assetType || !symbol) return;

        logger.info(`Stopping ingestion pipeline for topic: ${topic}`);

        if (assetType.toLowerCase() === 'crypto') {
            const cleanSymbol = symbol.toUpperCase();
            const conn = this.binanceConnections.get(cleanSymbol);
            if (conn) {
                conn.close();
                this.binanceConnections.delete(cleanSymbol);
                logger.info(`Closed Binance stream connection for: ${cleanSymbol}`);
            }
        }
    }

    /**
     * Ingestion pipeline: Binance WebSockets for Crypto
     */
    startCryptoFeed(symbol, topic) {
        const cleanSymbol = symbol.toUpperCase();
        // Check if already active
        if (this.binanceConnections.has(cleanSymbol)) return;

        const binanceUrl = `wss://stream.binance.com:9443/ws/${cleanSymbol.toLowerCase()}@kline_1m`;
        logger.info(`Opening Binance WebSocket connection: ${binanceUrl}`);

        try {
            const binanceWs = new WebSocket(binanceUrl);

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

                    this.broadcast(topic, {
                        type: 'live',
                        topic,
                        data: liveUpdate,
                        timestamp: Date.now()
                    });
                } catch (e) {
                    logger.error(`Binance data parse error: ${e.message}`);
                }
            });

            binanceWs.on('error', (err) => {
                logger.error(`Binance stream connection error: ${err.message}`);
            });

            binanceWs.on('close', () => {
                logger.info(`Binance stream connection closed for ${cleanSymbol}`);
                // Reconnect if there are still subscribers
                if (this.topicSubscribers.has(topic)) {
                    logger.info(`Reconnecting to Binance stream for ${cleanSymbol} in 3 seconds...`);
                    this.binanceConnections.delete(cleanSymbol);
                    setTimeout(() => this.startCryptoFeed(symbol, topic), 3000);
                }
            });

            this.binanceConnections.set(cleanSymbol, binanceWs);
        } catch (err) {
            logger.error(`Failed to connect to Binance socket: ${err.message}`);
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
