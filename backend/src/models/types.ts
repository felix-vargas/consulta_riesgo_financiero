export type UserRole = 'admin' | 'user';

export interface MockUser {
    id: string;
    username: string;
    passwordHash: string;
    name: string;
    role: UserRole;
    rut?: string;
}

export interface JwtTokenPayload {
    sub: string;
    role: UserRole;
    rut?: string;
    iat?: number;
    exp?: number;
}

export interface LoginResponse {
    token: string;
    user: {
        id: string;
        username: string;
        name: string;
        role: UserRole;
        rut?: string;
    };
}

export interface ScoreResponse {
    rut: string;
    score: number;
    fecha: string;
}
