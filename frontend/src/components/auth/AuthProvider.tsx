import { AuthContext, type LoginCallbacks } from '@/context/AuthContext';
import { extractApiError, loginRequest } from '@/lib/axios';
import type { AuthUser } from '@/types/api';
import { PropsWithChildren, useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'riesgo_financiero_session_v1';

interface StoredSession {
    token: string;
    user: AuthUser;
}

export default function AuthProvider({ children }: PropsWithChildren) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as StoredSession;
            if (parsed.token && parsed.user) {
                setToken(parsed.token);
                setUser(parsed.user);
            }
        } catch {
            sessionStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    const login = useCallback(
        async (
            username: string,
            password: string,
            callbacks: LoginCallbacks = {}
        ) => {
            try {
                const res = await loginRequest(username, password);
                setToken(res.token);
                setUser(res.user);
                sessionStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({ token: res.token, user: res.user })
                );
                callbacks.onSuccess?.();
            } catch (err) {
                const parsedErr = extractApiError(err);
                callbacks.onError?.(parsedErr.message);
            }
        },
        []
    );

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        sessionStorage.removeItem(STORAGE_KEY);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: Boolean(token && user),
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
