import { Router } from 'express';
import { createRateLimiter } from '../middlewares/security.js';
import { loginRequestSchema } from '../models/schemas.js';
import { authService } from '../services/auth.js';

export const authRouter = Router();

const loginRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 30,
    message:
        'Demasiados intentos de inicio de sesión. Por favor, espera un minuto antes de reintentar.',
});

/**
 * POST /login
 * Authenticates mock credentials and returns a signed JWT with { sub, role, rut? }.
 */
authRouter.post('/login', loginRateLimiter, async (req, res, next) => {
    try {
        const { username, password } = loginRequestSchema.parse(req.body);
        const result = await authService.login(username, password);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
});
