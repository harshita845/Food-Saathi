import http from 'http';
import express from 'express';
import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import { config } from './src/config/env.js';
import { connectRedis, closeRedis } from './src/config/redis.js';
import { initSocket, getInternalEmitSecret } from './src/config/socket.js';
import crypto from 'node:crypto';
import { logger } from './src/utils/logger.js';
import { loadEnvFromDb, startEnvAutoReload } from './src/config/envLoader.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { initializeFirebaseRealtime } from './src/config/firebase.js';

const app = express();

// Healthcheck route
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'socket', port: config.socketPort || 5001 });
});

const startSocketServer = async () => {
    try {
        logger.info(
            `[Bootstrap] Starting dedicated socket server redisEnabled=${config.redisEnabled} host=${config.host || '127.0.0.1'} socketPort=${config.socketPort || 5001}`
        );
        await connectDB();
        await loadEnvFromDb();
        startEnvAutoReload();
        initializeFirebaseRealtime();

        const httpServer = http.createServer(app);

        if (config.redisEnabled) {
            logger.info('[Bootstrap] Redis is enabled for dedicated socket server; connecting Redis client');
            await connectRedis();
        } else {
            logger.warn('[Bootstrap] Redis is disabled for dedicated socket server; sockets will run in local in-memory mode only');
        }

        logger.info('[Bootstrap] Initializing Socket.IO infrastructure on dedicated socket server');
        const io = await initSocket(httpServer);

        // Internal relay: the API server posts its socket events here when Redis is off.
        app.post('/internal/emit', express.json({ limit: '2mb' }), (req, res) => {
            const expected = Buffer.from(getInternalEmitSecret());
            const provided = Buffer.from(String(req.get('x-internal-secret') || ''));
            if (!expected.length || expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
                return res.status(401).json({ success: false });
            }
            const events = Array.isArray(req.body?.events) ? req.body.events : [];
            for (const entry of events) {
                if (!entry || typeof entry.event !== 'string') continue;
                const targetRooms = Array.isArray(entry.rooms) ? entry.rooms.map(String).filter(Boolean) : [];
                const target = targetRooms.length ? io.to(targetRooms) : io;
                target.emit(entry.event, entry.payload);
            }
            return res.json({ success: true, delivered: events.length });
        });

        const port = config.socketPort || 5001;
        httpServer.listen(port, config.host || '127.0.0.1', () => {
            logger.info(`Dedicated Socket.IO Server running on ${config.host || '127.0.0.1'}:${port}`);
        });

        const shutdown = async () => {
            logger.info('Shutting down Socket.IO Server');
            httpServer.close(async () => {
                await disconnectDB();
                if (config.redisEnabled) {
                    await closeRedis();
                }
                process.exit(0);
            });
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (err) {
        logger.error(`Socket Server startup error: ${err.message}`);
        process.exit(1);
    }
};

startSocketServer();

