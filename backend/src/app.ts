import cors from 'cors';
import express, { type Express } from 'express';
import { getSettings } from './config/settings.js';
import {
    exceptionHandler,
    notFoundHandler,
} from './middlewares/exceptionHandler.js';
import { securityHeaders } from './middlewares/security.js';
import { authRouter } from './routers/auth.js';
import { scoreRouter } from './routers/score.js';

export function createApp(): Express {
    const app = express();
    const settings = getSettings();

    app.disable('x-powered-by');
    app.use(securityHeaders);

    app.use(
        cors({
            origin: settings.corsOrigin,
            credentials: true,
            methods: ['GET', 'POST', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        })
    );

    app.use(express.json({ limit: '16kb' }));

    app.get('/health', (_req, res) => {
        res.status(200).json({ status: 'ok' });
    });

    app.use(authRouter);
    app.use(scoreRouter);

    app.use(notFoundHandler);
    app.use(exceptionHandler);

    return app;
}

export const app = createApp();
