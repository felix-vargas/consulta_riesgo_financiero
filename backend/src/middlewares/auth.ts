import type { Request, Response, NextFunction } from 'express';
import type { JwtTokenPayload } from '../models/types.js';
import { authService } from '../services/auth.js';
import { normalizeRut } from '../utils/rut.js';
import { HttpException } from './exceptionHandler.js';

declare global {
    namespace Express {
        interface Request {
            user?: JwtTokenPayload;
        }
    }
}

/**
 * Authentication Middleware:
 * Extracts the Bearer token from the Authorization header and validates its signature and expiration.
 */
export function authenticateJwt(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next(
            new HttpException(
                401,
                'Se requiere un token de autenticación Bearer.',
                'MISSING_AUTH_TOKEN'
            )
        );
        return;
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
        next(
            new HttpException(
                401,
                'Se requiere un token de autenticación Bearer.',
                'MISSING_AUTH_TOKEN'
            )
        );
        return;
    }

    try {
        req.user = authService.verifyToken(token);
        next();
    } catch (err) {
        next(err);
    }
}

/**
 * Authorization Middleware (RBAC + Ownership):
 * - Role 'admin': Allowed to query any RUT.
 * - Role 'user': Only allowed to query their own RUT (must match token payload's `rut`).
 */
export function authorizeRutAccess(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    const currentUser = req.user;

    if (!currentUser) {
        next(
            new HttpException(
                401,
                'Usuario no autenticado.',
                'UNAUTHENTICATED'
            )
        );
        return;
    }

    if (currentUser.role === 'admin') {
        next();
        return;
    }

    if (currentUser.role === 'user') {
        const rawParam = req.params.rut;
        const requestedRut = Array.isArray(rawParam) ? rawParam[0] ?? '' : rawParam ?? '';
        const userTokenRut = currentUser.rut;

        if (!userTokenRut) {
            next(
                new HttpException(
                    403,
                    'El token de usuario no tiene un RUT asociado para validar pertenencia.',
                    'FORBIDDEN_MISSING_USER_RUT'
                )
            );
            return;
        }

        if (normalizeRut(requestedRut) !== normalizeRut(userTokenRut)) {
            next(
                new HttpException(
                    403,
                    'Acceso denegado: Con rol "user" solo tienes permiso para consultar tu propio RUT.',
                    'FORBIDDEN_RUT_MISMATCH'
                )
            );
            return;
        }

        next();
        return;
    }

    next(
        new HttpException(
            403,
            'Rol de usuario no autorizado para realizar esta consulta.',
            'FORBIDDEN_ROLE'
        )
    );
}
