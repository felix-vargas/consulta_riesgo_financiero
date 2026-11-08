import dotenv from 'dotenv';

dotenv.config();

export interface Settings {
    port: number;
    jwtSecret: string;
    jwtExpiresIn: string;
    corsOrigin: string | string[];
}

export function getSettings(): Settings {
    return {
        port: Number(process.env.PORT ?? 4000),
        jwtSecret:
            process.env.JWT_SECRET ??
            'consulta-riesgo-financiero-secret-key-2026',
        jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
        corsOrigin: process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
            : ['http://localhost:5173', 'http://localhost:3000'],
    };
}
