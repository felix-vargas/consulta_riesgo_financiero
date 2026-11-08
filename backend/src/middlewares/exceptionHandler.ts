import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class HttpException extends Error {
    public readonly statusCode: number;
    public readonly code: string;

    constructor(statusCode: number, message: string, code = 'HTTP_ERROR') {
        super(message);
        this.name = 'HttpException';
        this.statusCode = statusCode;
        this.code = code;
    }
}

export function notFoundHandler(_req: Request, res: Response): void {
    res.status(404).json({
        error: 'NOT_FOUND',
        message: 'El recurso solicitado no existe.',
    });
}

export const exceptionHandler: ErrorRequestHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    if (err instanceof HttpException) {
        if (err.statusCode === 401) {
            res.setHeader('WWW-Authenticate', 'Bearer');
        }
        res.status(err.statusCode).json({
            error: err.code,
            message: err.message,
        });
        return;
    }

    if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
        res.status(400).json({
            error: 'MALFORMED_JSON',
            message: 'El cuerpo de la solicitud no es un JSON válido.',
        });
        return;
    }

    if (err instanceof ZodError) {
        const firstIssue = err.issues[0];
        res.status(400).json({
            error: 'VALIDATION_ERROR',
            message: firstIssue?.message ?? 'Datos de entrada inválidos.',
            details: err.issues.map((issue) => ({
                path: issue.path.join('.'),
                message: issue.message,
            })),
        });
        return;
    }

    console.error('[UnhandledException]', err);
    res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Ocurrió un error interno en el servidor.',
    });
};
