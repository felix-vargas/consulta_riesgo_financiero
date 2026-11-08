import { createContext } from 'react';
import type { AuthUser } from '@/types/api';

export interface LoginCallbacks {
    onSuccess?: () => void;
    onError?: (message: string) => void;
}

export interface AuthContextValue {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (
        username: string,
        password: string,
        callbacks?: LoginCallbacks
    ) => Promise<void>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
    user: null,
    token: null,
    isAuthenticated: false,
    login: async () => {},
    logout: () => {},
});
