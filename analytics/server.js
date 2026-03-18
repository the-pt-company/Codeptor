require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./src/config/db');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const { router: streamRoutes, startChangeStream } = require('./src/routes/streamRoutes');
const errorHandler = require('./src/middleware/errorHandler');
const rateLimiter = require('./src/middleware/rateLimiter');
const AppError = require('./src/utils/AppError');

// ─── App Initialisation ────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Global Middleware ─────────────────────────────────────────────────────────

app.set('trust proxy', 1);
app.use(helmet());

const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
    cors({
        origin: corsOrigin === '*' ? '*' : corsOrigin.split(',').map((o) => o.trim()),
        methods: ['GET', 'POST'],
        credentials: true,
    })
);

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10kb' }));
app.use('/api', rateLimiter);

// ─── Routes ────────────────────────────────────────────────────────────────────

app.use('/api/analytics', analyticsRoutes);
app.use('/api/analytics', streamRoutes);

app.all('*', (req, _res, next) => {
    next(new AppError(`Cannot find ${req.method} ${req.originalUrl}`, 404));
});

// ─── Error Handler ─────────────────────────────────────────────────────────────

app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────────

const startServer = async () => {
    await connectDB();

    // Start MongoDB Change Stream watcher for live analytics
    startChangeStream();

    const server = app.listen(PORT, () => {
        console.log(`Analytics server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });

    const shutdown = (signal) => {
        console.log(`\n${signal} received. Shutting down gracefully…`);
        server.close(() => {
            console.log('HTTP server closed.');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();

