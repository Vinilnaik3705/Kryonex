require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cryptoRoutes = require("./routes/cryptoRoutes");
const newsRoutes = require("./routes/newsRoutes");
const aiRoutes = require("./routes/aiRoutes");
const simulationRoutes = require("./routes/simulationRoutes");
const coinLogos = require("./routes/coinLogos");
const errorHandler = require("./middleware/errorHandler");
const rateLimiter = require("./middleware/rateLimiter");
const connectDB = require("./config/db");
const websocketService = require("./services/websocketService");

const app = express();
const PORT = process.env.PORT || 5000;
const configuredOrigins = (process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean);
const corsOptions = {
    origin: [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://kryonex.vercel.app",
        "https://tradesim-9yh.pages.dev",
        ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
        ...configuredOrigins
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};

app.use(helmet());
app.use(compression());

// Middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));


connectDB();

app.use(rateLimiter);

app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.get("/", (req, res) => {
    res.send("Kryonex Backend Running ✅");
});

app.get("/api", (req, res) => {
    res.json({
        success: true,
        name: "Kryonex API",
        health: "/health",
        endpoints: ["/api/crypto", "/api/news", "/api/simulation", "/api/ai"],
    });
});

app.use("/api/crypto", cryptoRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/simulation", simulationRoutes);
app.use("/api/coin-logos", coinLogos);
app.use("/api/auth", require("./routes/authRoutes"));

app.use((req, res) => {
    res.status(404).json({
        error: "Not Found",
        message: `Route ${req.method} ${req.url} not found`
    });
});

app.use(errorHandler);

if (require.main === module && !process.env.VERCEL) {
    const http = require("http");
    const server = http.createServer(app);

    // Initialize unified WebSocket gateway
    websocketService.init(server);

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
