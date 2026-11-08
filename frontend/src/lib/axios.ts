import axios, { AxiosError } from 'axios';
import type { ApiErrorPayload, LoginResponse, ScoreResponse } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export const axiosBase = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export async function loginRequest(
    username: string,
    password: string
): Promise<LoginResponse> {
    const res = await axiosBase.post<LoginResponse>('/login', {
        username,
        password,
    });
    return res.data;
}

export async function fetchScoreByRut(
    rut: string,
    token: string
): Promise<ScoreResponse> {
    const res = await axiosBase.get<ScoreResponse>(
        `/score/${encodeURIComponent(rut.trim())}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
}

export function extractApiError(error: unknown): {
    status: number | null;
    code: string;
    message: string;
} {
    if (axios.isAxiosError(error)) {
        const axiosErr = error as AxiosError<ApiErrorPayload>;
        const status = axiosErr.response?.status ?? null;
        const data = axiosErr.response?.data;

        if (data && typeof data.message === 'string') {
            return {
                status,
                code: data.error ?? 'API_ERROR',
                message: data.message,
            };
        }

        if (status === 401) {
            return {
                status: 401,
                code: 'UNAUTHORIZED',
                message: 'No autorizado. Verifica tus credenciales o inicia sesión nuevamente.',
            };
        }

        if (status === 403) {
            return {
                status: 403,
                code: 'FORBIDDEN',
                message: 'No tienes permisos para consultar el RUT solicitado.',
            };
        }

        if (status === 429) {
            return {
                status: 429,
                code: 'TOO_MANY_REQUESTS',
                message: 'Demasiados intentos. Por favor, espera unos segundos antes de reintentar.',
            };
        }

        return {
            status,
            code: 'NETWORK_ERROR',
            message: 'No fue posible conectar con el servidor de riesgo financiero.',
        };
    }

    return {
        status: null,
        code: 'UNKNOWN_ERROR',
        message: 'Ocurrió un error inesperado al procesar la solicitud.',
    };
}
