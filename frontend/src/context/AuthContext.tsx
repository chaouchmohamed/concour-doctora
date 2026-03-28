import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthUser } from '../types';

export const API_BASE = 'http://localhost:8000/api';

interface AuthContextValue {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    changePassword: (newPassword: string, currentPassword?: string) => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
};

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------
const getAccess = () => localStorage.getItem('access_token');
const getRefresh = () => localStorage.getItem('refresh_token');
const setTokens = (access: string, refresh: string) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
};
const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};

/**
 * Make an authenticated fetch. On 401 it tries to refresh the access
 * token once; on second failure it returns the failed Response.
 */
export async function authFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    const access = getAccess();
    if (access) headers.set('Authorization', `Bearer ${access}`);

    let res = await fetch(input, { ...init, headers });

    if (res.status === 401) {
        const refresh = getRefresh();
        if (refresh) {
            const refreshRes = await fetch(`${API_BASE}/auth/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh }),
            });
            if (refreshRes.ok) {
                const data = await refreshRes.json();
                localStorage.setItem('access_token', data.access);
                headers.set('Authorization', `Bearer ${data.access}`);
                res = await fetch(input, { ...init, headers });
            }
        }
    }

    return res;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    /** Fetch current user profile using stored token */
    const fetchMe = useCallback(async () => {
        try {
            const res = await authFetch(`${API_BASE}/auth/me/`);
            if (res.ok) {
                const data: AuthUser = await res.json();
                setUser(data);
            } else {
                clearTokens();
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshUser = useCallback(async () => {
        await fetchMe();
    }, [fetchMe]);

    // On mount: if we have a stored token, verify it
    useEffect(() => {
        if (getAccess()) {
            fetchMe();
        } else {
            setIsLoading(false);
        }
    }, [fetchMe]);

    const login = useCallback(async (username: string, password: string) => {
        const res = await fetch(`${API_BASE}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Invalid credentials');
        }

        const data = await res.json();
        setTokens(data.access, data.refresh);
        setUser(data.user as AuthUser);
    }, []);

    /**
     * Change password (authenticated). Used for both:
     *  - First-login forced change (must_change_password = true)
     *  - Regular change from settings
     * After success, refreshes user so must_change_password becomes false.
     */
    const changePassword = useCallback(async (newPassword: string, currentPassword?: string) => {
        const body: Record<string, string> = { new_password: newPassword };
        if (currentPassword) body.current_password = currentPassword;

        const res = await authFetch(`${API_BASE}/auth/change-password/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || err.detail || 'Failed to change password');
        }

        // Backend returns fresh tokens after password change — store them
        const data = await res.json();
        if (data.access && data.refresh) {
            setTokens(data.access, data.refresh);
        }

        // Refresh user so must_change_password flag is updated to false
        await fetchMe();
    }, [fetchMe]);

    const logout = useCallback(async () => {
        const refresh = getRefresh();
        try {
            if (refresh) {
                await authFetch(`${API_BASE}/auth/logout/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh }),
                });
            }
        } catch {
            // ignore
        } finally {
            clearTokens();
            setUser(null);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, changePassword, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
