"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import { googleLogout } from "@react-oauth/google";
import { api, isUnauthorizedError, type Me } from "@/lib/api";

type AuthContextValue = {
	token: string | null;
	me: Me | null;
	loading: boolean;
	error: string | null;
	signIn: (token: string) => Promise<boolean>;
	signOut: () => void;
	clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_TOKEN_STORAGE_KEY = "dartmouth-dining-token";

function clearStoredToken() {
	window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [token, setToken] = useState<string | null>(null);
	const [me, setMe] = useState<Me | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const signOut = useCallback(() => {
		googleLogout();
		clearStoredToken();
		setToken(null);
		setMe(null);
		setError(null);
		setLoading(false);
	}, []);

	const restoreAuth = useCallback(async () => {
		const storedToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
		if (!storedToken) {
			setToken(null);
			setMe(null);
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const nextMe = await api.me(storedToken);
			setToken(storedToken);
			setMe(nextMe);
		} catch (e) {
			if (isUnauthorizedError(e)) {
				signOut();
				return;
			}
			setError(e instanceof Error ? e.message : "Could not restore sign-in");
		} finally {
			setLoading(false);
		}
	}, [signOut]);

	useEffect(() => {
		void restoreAuth();

		const handlePageShow = (event: PageTransitionEvent) => {
			if (event.persisted) void restoreAuth();
		};

		window.addEventListener("pageshow", handlePageShow);
		return () => window.removeEventListener("pageshow", handlePageShow);
	}, [restoreAuth]);

	const signIn = useCallback(async (nextToken: string) => {
		setLoading(true);
		setError(null);
		try {
			const nextMe = await api.me(nextToken);
			window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, nextToken);
			setToken(nextToken);
			setMe(nextMe);
			return true;
		} catch (e) {
			signOut();
			setError(e instanceof Error ? e.message : "Sign-in failed");
			return false;
		} finally {
			setLoading(false);
		}
	}, [signOut]);

	const clearError = useCallback(() => setError(null), []);

	const value = useMemo(
		() => ({ token, me, loading, error, signIn, signOut, clearError }),
		[token, me, loading, error, signIn, signOut, clearError],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const value = useContext(AuthContext);
	if (!value) throw new Error("useAuth must be used within AuthProvider");
	return value;
}
