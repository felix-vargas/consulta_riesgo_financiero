import crypto from 'node:crypto';
import { promisify } from 'node:util';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { getSettings } from '../config/settings.js';
import { HttpException } from '../middlewares/exceptionHandler.js';
import type {
    JwtTokenPayload,
    LoginResponse,
    MockUser,
} from '../models/types.js';
import { formatRut, normalizeRut } from '../utils/rut.js';

const scryptAsync = promisify(crypto.scrypt);

const PASSWORD_HASH_SALT = 'riesgo-financiero:auth:scrypt:v1';
const JWT_ISSUER = 'riesgo-financiero-api';
const JWT_AUDIENCE = 'riesgo-financiero-spa';

function hashPasswordAtStartup(plainPassword: string): string {
    return crypto
        .scryptSync(plainPassword, PASSWORD_HASH_SALT, 32)
        .toString('hex');
}

/**
 * Asynchronous constant-time password verification using non-blocking crypto.scrypt
 * (delegated to libuv's thread pool so the Node.js event loop is never blocked on requests)
 * + crypto.timingSafeEqual to prevent timing side-channel attacks.
 */
async function verifyPasswordConstantTime(
    candidatePassword: string,
    expectedHashHex: string
): Promise<boolean> {
    const candidateBuf = (await scryptAsync(
        candidatePassword,
        PASSWORD_HASH_SALT,
        32
    )) as Buffer;
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
const DUMMY_PASSWORD_HASH = hashPasswordAtStartup(
    'dummy-fallback-secret-password'
);

/**
 * In-memory mock credentials for MVP evaluation (admin & user roles).
 * Passwords are stored as scrypt digests rather than plaintext.
 */
export const MOCK_USERS: readonly MockUser[] = [
    {
        id: 'usr-admin-01',
        username: 'admin',
        passwordHash: hashPasswordAtStartup('AdminPassword123!'),
        name: 'Ejecutivo',
        role: 'admin',
    },
    {
        id: 'usr-client-01',
        username: 'usuario',
        passwordHash: hashPasswordAtStartup('UserPassword123!'),
        name: 'Juan Pérez',
        role: 'user',
        rut: '12.345.678-9',
    },
    {
        id: 'usr-client-02',
        username: 'empresa',
        passwordHash: hashPasswordAtStartup('EmpresaPassword123!'),
        name: 'Comercial Pepito SpA',
        role: 'user',
        rut: '76.543.210-3',
    },
];

export class AuthService {
    /**
     * Authenticates a user against mock credentials (by username or RUT) and issues a signed JWT.
     */
    public async login(
        usernameOrRut: string,
        password: string
    ): Promise<LoginResponse> {
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
        const isPasswordValid = await verifyPasswordConstantTime(
            password,
            targetHash
        );

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
