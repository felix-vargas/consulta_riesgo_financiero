import { Router } from 'express';
import { authenticateJwt, authorizeRutAccess } from '../middlewares/auth.js';
import { scoreService } from '../services/score.js';

export const scoreRouter = Router();

/**
 * GET /score/:rut
 * Protected by JWT authentication and role/ownership authorization middlewares.
 * Returns { rut, score, fecha }.
 */
scoreRouter.get(
    '/score/:rut',
    authenticateJwt,
    authorizeRutAccess,
    (req, res, next) => {
        try {
            const rawRut = req.params.rut;
            const rut = Array.isArray(rawRut) ? rawRut[0] ?? '' : rawRut ?? '';
            const result = scoreService.getScoreByRut(rut);
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
);
