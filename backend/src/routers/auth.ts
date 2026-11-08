import { Router } from 'express';
import { loginRequestSchema } from '../models/schemas.js';
import { authService } from '../services/auth.js';

export const authRouter = Router();

/**
 * POST /login
 * Authenticates mock credentials and returns a signed JWT with { sub, role, rut? }.
 */
authRouter.post('/login', (req, res, next) => {
    try {
        const { username, password } = loginRequestSchema.parse(req.body);
        const result = authService.login(username, password);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
});
