import type { Request, Response, NextFunction } from 'express';
import { HttpException } from './exceptionHandler.js';

/**
 * Sets standard HTTP security headers (OWASP recommendations) on API responses:
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - Referrer-Policy: no-referrer
 * - Content-Security-Policy: default-src 'none'; frame-ancestors 'none'
 * - Cache-Control: no-store (prevents sensitive financial score / JWT caching in shared proxies)
 */
export function securityHeaders(
    _req: Request,
    res: Response,
    next: NextFunction
): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'none'; frame-ancestors 'none'"
    );
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    next();
}

interface RateLimitBucket {
    count: number;
    resetAt: number;
}

/**
 * Lightweight in-memory fixed-window rate limiter to protect endpoints (e.g. POST /login)
 * against brute-force / credential-stuffing attacks.
 */
export function createRateLimiter(options: {
    windowMs: number;
    maxRequests: number;
    message?: string;
}) {
    const buckets = new Map<string, RateLimitBucket>();

    return function rateLimiter(
        req: Request,
        res: Response,
        next: NextFunction
    ): void {
        const now = Date.now();
        const clientKey = req.ip ?? req.socket.remoteAddress ?? 'unknown';

        if (buckets.size > 1000) {
            for (const [key, entry] of buckets.entries()) {
                if (entry.resetAt <= now) {
                    buckets.delete(key);
                }
            }
        }

        const existing = buckets.get(clientKey);
        if (!existing || existing.resetAt <= now) {
            buckets.set(clientKey, {
                count: 1,
                resetAt: now + options.windowMs,
            });
            next();
            return;
        }

        existing.count += 1;

        if (existing.count > options.maxRequests) {
            const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
            res.setHeader('Retry-After', String(retryAfterSeconds));
            next(
                new HttpException(
                    429,
                    options.message ??
                        'Demasiados intentos. Por favor, espera unos segundos antes de volver a intentar.',
                    'TOO_MANY_REQUESTS'
                )
            );
            return;
        }

        next();
    };
}
