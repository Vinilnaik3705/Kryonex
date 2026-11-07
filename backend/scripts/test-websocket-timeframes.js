const WebSocket = require('ws');

const url = process.env.WS_URL || 'ws://localhost:5000/ws';
const topics = [
    { topic: 'crypto:BTCUSDT:5m', intervalSeconds: 300 },
    { topic: 'crypto:BTCUSDT:1h', intervalSeconds: 3600 },
];

const socket = new WebSocket(url);
const previousTimes = new Map();
let timeout;
let topicIndex = 0;

const finish = (error) => {
    clearTimeout(timeout);
    if (error) console.error(error.message);
    socket.close();
    process.exitCode = error ? 1 : 0;
};

const subscribeNext = () => {
    const current = topics[topicIndex];
    if (!current) {
        finish();
        return;
    }
    socket.send(JSON.stringify({ action: 'subscribe', topic: current.topic }));
};

socket.on('open', subscribeNext);

socket.on('message', (rawMessage) => {
    const message = JSON.parse(rawMessage);
    if (message.error) {
        finish(new Error(message.error));
        return;
    }
    if (message.type !== 'live') return;

    const current = topics[topicIndex];
    if (message.topic !== current.topic) return;

    const time = Number(message.data?.time);
    const previousTime = previousTimes.get(current.topic);
    const delta = previousTime === undefined ? 'n/a' : time - previousTime;
    const aligned = Number.isFinite(time) && time % current.intervalSeconds === 0;
    console.log(`${current.topic}: time=${time}, delta=${delta}s, aligned=${aligned}`);
    previousTimes.set(current.topic, time);

    socket.send(JSON.stringify({ action: 'unsubscribe', topic: current.topic }));
    topicIndex += 1;
    subscribeNext();
});

socket.on('error', (error) => finish(error));
timeout = setTimeout(() => finish(new Error('Timed out waiting for live candle data')), 20000);
