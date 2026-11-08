export type UserRole = 'admin' | 'user';

export interface AuthUser {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    rut?: string;
}

export interface LoginResponse {
    token: string;
    user: AuthUser;
}

export interface ScoreResponse {
    rut: string;
    score: number;
    fecha: string;
}

export interface ApiErrorPayload {
    error: string;
    message: string;
    details?: Array<{
        path: string;
        message: string;
    }>;
}
