import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { getSettings } from '../config/settings.js';
import type { JwtTokenPayload } from '../models/types.js';

describe('Financial Risk Consultation API (Auth, RBAC & Deterministic Score)', () => {
    describe('POST /login', () => {
        it('issues a signed JWT for role "admin" with { sub, role } and WITHOUT "rut"', async () => {
            const res = await request(app).post('/login').send({
                username: 'admin',
                password: 'AdminPassword123!',
            });

            expect(res.status).toBe(200);
            expect(res.body.token).toBeTypeOf('string');
            expect(res.body.user.role).toBe('admin');
            expect(res.body.user.rut).toBeUndefined();

            const decoded = jwt.verify(
                res.body.token,
                getSettings().jwtSecret
            ) as JwtTokenPayload;

            expect(decoded.sub).toBe('usr-admin-01');
            expect(decoded.role).toBe('admin');
            expect(decoded.rut).toBeUndefined();
        });

        it('issues a signed JWT for role "user" containing { sub, role, rut }', async () => {
            const res = await request(app).post('/login').send({
                username: 'usuario',
                password: 'UserPassword123!',
            });

            expect(res.status).toBe(200);
            expect(res.body.token).toBeTypeOf('string');
            expect(res.body.user.role).toBe('user');
            expect(res.body.user.rut).toBe('12.345.678-9');

            const decoded = jwt.verify(
                res.body.token,
                getSettings().jwtSecret
            ) as JwtTokenPayload;

            expect(decoded.sub).toBe('usr-client-01');
            expect(decoded.role).toBe('user');
            expect(decoded.rut).toBe('12.345.678-9');
        });

        it('returns 401 on invalid credentials and 400 on empty payload', async () => {
            const unauthorized = await request(app).post('/login').send({
                username: 'usuario',
                password: 'wrong-password',
            });
            expect(unauthorized.status).toBe(401);
            expect(unauthorized.body.error).toBe('INVALID_CREDENTIALS');

            const badRequest = await request(app).post('/login').send({
                username: '',
                password: '',
            });
            expect(badRequest.status).toBe(400);
            expect(badRequest.body.error).toBe('VALIDATION_ERROR');
        });
    });

    describe('GET /score/:rut — Authentication & Authorization Middlewares', () => {
        it('rejects unauthenticated requests with 401', async () => {
            const res = await request(app).get('/score/12.345.678-9');
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('MISSING_AUTH_TOKEN');
        });

        it('rejects expired or forged JWT tokens with 401', async () => {
            const expiredToken = jwt.sign(
                { sub: 'usr-client-01', role: 'user', rut: '12.345.678-9' },
                getSettings().jwtSecret,
                {
                    algorithm: 'HS256',
                    expiresIn: -10,
                    issuer: 'riesgo-financiero-api',
                    audience: 'riesgo-financiero-spa',
                }
            );

            const expiredRes = await request(app)
                .get('/score/12.345.678-9')
                .set('Authorization', `Bearer ${expiredToken}`);

            expect(expiredRes.status).toBe(401);
            expect(expiredRes.body.error).toBe('TOKEN_EXPIRED');

            const forgedToken = jwt.sign(
                { sub: 'usr-admin-01', role: 'admin' },
                'wrong-secret-key'
            );

            const forgedRes = await request(app)
                .get('/score/12.345.678-9')
                .set('Authorization', `Bearer ${forgedToken}`);

            expect(forgedRes.status).toBe(401);
            expect(forgedRes.body.error).toBe('INVALID_TOKEN');
        });

        it('allows role "user" to query their own RUT (even with different dot formatting)', async () => {
            const loginRes = await request(app).post('/login').send({
                username: 'usuario',
                password: 'UserPassword123!',
            });
            const token = loginRes.body.token as string;

            const dottedRes = await request(app)
                .get('/score/12.345.678-9')
                .set('Authorization', `Bearer ${token}`);

            expect(dottedRes.status).toBe(200);
            expect(dottedRes.body.rut).toBe('12.345.678-9');
            expect(dottedRes.body.score).toBe(73);
            expect(dottedRes.body.fecha).toMatch(
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
            );

            const undottedRes = await request(app)
                .get('/score/12345678-9')
                .set('Authorization', `Bearer ${token}`);

            expect(undottedRes.status).toBe(200);
            expect(undottedRes.body.rut).toBe('12.345.678-9');
            expect(undottedRes.body.score).toBe(dottedRes.body.score);
        });

        it('blocks role "user" with 403 Forbidden when querying another RUT', async () => {
            const loginRes = await request(app).post('/login').send({
                username: 'usuario',
                password: 'UserPassword123!',
            });
            const token = loginRes.body.token as string;

            const forbiddenRes = await request(app)
                .get('/score/76.543.210-3')
                .set('Authorization', `Bearer ${token}`);

            expect(forbiddenRes.status).toBe(403);
            expect(forbiddenRes.body.error).toBe('FORBIDDEN_RUT_MISMATCH');
        });

        it('allows role "admin" to query any valid RUT and returns deterministic, varying scores', async () => {
            const loginRes = await request(app).post('/login').send({
                username: 'admin',
                password: 'AdminPassword123!',
            });
            const adminToken = loginRes.body.token as string;

            const rutAFirst = await request(app)
                .get('/score/12.345.678-9')
                .set('Authorization', `Bearer ${adminToken}`);
            const rutASecond = await request(app)
                .get('/score/12345678-9')
                .set('Authorization', `Bearer ${adminToken}`);
            const rutB = await request(app)
                .get('/score/76.543.210-3')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(rutAFirst.status).toBe(200);
            expect(rutASecond.status).toBe(200);
            expect(rutB.status).toBe(200);

            expect(rutAFirst.body.score).toBe(rutASecond.body.score);
            expect(rutAFirst.body.score).not.toBe(rutB.body.score);
        });

        it('returns 400 Bad Request when an authorized user queries a malformed RUT', async () => {
            const loginRes = await request(app).post('/login').send({
                username: 'admin',
                password: 'AdminPassword123!',
            });
            const adminToken = loginRes.body.token as string;

            const invalidRutRes = await request(app)
                .get('/score/rut-invalido-123')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(invalidRutRes.status).toBe(400);
            expect(invalidRutRes.body.error).toBe('INVALID_RUT');
        });

        it('sets OWASP security headers and hides x-powered-by', async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
            expect(res.headers['x-powered-by']).toBeUndefined();
            expect(res.headers['x-content-type-options']).toBe('nosniff');
            expect(res.headers['x-frame-options']).toBe('DENY');
            expect(res.headers['cache-control']).toContain('no-store');
        });
    });
});
