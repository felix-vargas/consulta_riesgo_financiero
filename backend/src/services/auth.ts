import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { getSettings } from '../config/settings.js';
import { HttpException } from '../middlewares/exceptionHandler.js';
import type {
    JwtTokenPayload,
    LoginResponse,
    MockUser,
} from '../models/types.js';
import { formatRut, normalizeRut } from '../utils/rut.js';

const PASSWORD_HASH_SALT = 'prontopaga:auth:scrypt:v1';
const JWT_ISSUER = 'prontopaga-risk-api';
const JWT_AUDIENCE = 'prontopaga-risk-spa';

function derivePasswordDigest(plainPassword: string): Buffer {
    return crypto.scryptSync(plainPassword, PASSWORD_HASH_SALT, 32);
}

function hashPassword(plainPassword: string): string {
    return derivePasswordDigest(plainPassword).toString('hex');
}

/**
 * Constant-time password verification using scrypt + crypto.timingSafeEqual
 * to prevent timing side-channel attacks and avoid storing plaintext passwords.
 */
function verifyPasswordConstantTime(
    candidatePassword: string,
    expectedHashHex: string
): boolean {
    const candidateBuf = derivePasswordDigest(candidatePassword);
    const expectedBuf = Buffer.from(expectedHashHex, 'hex');
    if (candidateBuf.length !== expectedBuf.length) {
        return false;
    }
    return crypto.timingSafeEqual(candidateBuf, expectedBuf);
}

/**
 * Pre-computed dummy hash evaluated when a username/RUT does not exist,
 * preventing user enumeration via response-time differences.
 */
const DUMMY_PASSWORD_HASH = hashPassword('dummy-fallback-secret-password');

/**
 * In-memory mock credentials for MVP evaluation (admin & user roles).
 * Passwords are stored as scrypt digests rather than plaintext.
 */
export const MOCK_USERS: readonly MockUser[] = [
    {
        id: 'usr-admin-01',
        username: 'admin',
        passwordHash: hashPassword('AdminPassword123!'),
        name: 'Ejecutivo',
        role: 'admin',
    },
    {
        id: 'usr-client-01',
        username: 'usuario',
        passwordHash: hashPassword('UserPassword123!'),
        name: 'Juan Pérez',
        role: 'user',
        rut: '12.345.678-9',
    },
    {
        id: 'usr-client-02',
        username: 'empresa',
        passwordHash: hashPassword('EmpresaPassword123!'),
        name: 'Comercial Pepito SpA',
        role: 'user',
        rut: '76.543.210-3',
    },
];

export class AuthService {
    /**
     * Authenticates a user against mock credentials (by username or RUT) and issues a signed JWT.
     */
    public login(usernameOrRut: string, password: string): LoginResponse {
        const normalizedInput = usernameOrRut.trim().toLowerCase();
        const normalizedRutInput = normalizeRut(usernameOrRut);

        const matchedUser = MOCK_USERS.find((candidate) => {
            const byUsername =
                candidate.username.toLowerCase() === normalizedInput;
            const byRut =
                candidate.rut !== undefined &&
                normalizeRut(candidate.rut) === normalizedRutInput;
            return byUsername || byRut;
        });

        const targetHash = matchedUser
            ? matchedUser.passwordHash
            : DUMMY_PASSWORD_HASH;
        const isPasswordValid = verifyPasswordConstantTime(password, targetHash);

        if (!matchedUser || !isPasswordValid) {
            throw new HttpException(
                401,
                'Credenciales inválidas. Verifica tu RUT y contraseña.',
                'INVALID_CREDENTIALS'
            );
        }

        const payload: JwtTokenPayload = {
            sub: matchedUser.id,
            role: matchedUser.role,
            ...(matchedUser.role === 'user' && matchedUser.rut
                ? { rut: formatRut(matchedUser.rut) }
                : {}),
        };

        const settings = getSettings();
        const signOptions: SignOptions = {
            algorithm: 'HS256',
            expiresIn: settings.jwtExpiresIn as SignOptions['expiresIn'],
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        };

        const token = jwt.sign(payload, settings.jwtSecret, signOptions);

        return {
            token,
            user: {
                id: matchedUser.id,
                username: matchedUser.username,
                name: matchedUser.name,
                role: matchedUser.role,
                ...(matchedUser.role === 'user' && matchedUser.rut
                    ? { rut: formatRut(matchedUser.rut) }
                    : {}),
            },
        };
    }

    /**
     * Verifies JWT signature, algorithm allowlist (HS256), and expiration, returning the typed payload.
     */
    public verifyToken(token: string): JwtTokenPayload {
        const settings = getSettings();

        try {
            const decoded = jwt.verify(token, settings.jwtSecret, {
                algorithms: ['HS256'],
            });
            if (
                typeof decoded !== 'object' ||
                decoded === null ||
                typeof decoded.sub !== 'string' ||
                (decoded.role !== 'admin' && decoded.role !== 'user')
            ) {
                throw new HttpException(
                    401,
                    'El token proporcionado tiene una estructura inválida.',
                    'INVALID_TOKEN_PAYLOAD'
                );
            }

            return decoded as JwtTokenPayload;
        } catch (err) {
            if (err instanceof HttpException) {
                throw err;
            }
            if (err instanceof jwt.TokenExpiredError) {
                throw new HttpException(
                    401,
                    'La sesión ha expirado. Por favor, inicia sesión nuevamente.',
                    'TOKEN_EXPIRED'
                );
            }
            throw new HttpException(
                401,
                'Token de autenticación inválido o malformado.',
                'INVALID_TOKEN'
            );
        }
    }
}

export const authService = new AuthService();
