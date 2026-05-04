"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { api, type Me } from "@/lib/api";

type AuthContextValue = {
	token: string | null;
	me: Me | null;
	loading: boolean;
	error: string | null;
	signIn: (token: string) => Promise<boolean>;
	clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [token, setToken] = useState<string | null>(null);
	const [me, setMe] = useState<Me | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const signIn = useCallback(async (nextToken: string) => {
		setLoading(true);
		setError(null);
		try {
			const nextMe = await api.me(nextToken);
			setToken(nextToken);
			setMe(nextMe);
			return true;
		} catch (e) {
			setToken(null);
			setMe(null);
			setError(e instanceof Error ? e.message : "Sign-in failed");
			return false;
		} finally {
			setLoading(false);
		}
	}, []);

	const clearError = useCallback(() => setError(null), []);

	const value = useMemo(
		() => ({ token, me, loading, error, signIn, clearError }),
		[token, me, loading, error, signIn, clearError],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const value = useContext(AuthContext);
	if (!value) throw new Error("useAuth must be used within AuthProvider");
	return value;
}
