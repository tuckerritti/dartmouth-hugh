import { API_URL } from "./env";

export type Preferences = {
	email: string;
	subscribed: boolean;
	breakfast: boolean;
	lunch: boolean;
	dinner: boolean;
};

export type Me = { email: string; name: string | null; preferences: Preferences };

const API_ERROR_MESSAGES: Record<string, string> = {
	ERR_DARTMOUTH_EMAIL_REQUIRED: "Please sign in with a @dartmouth.edu Google account.",
	ERR_UNAUTHORIZED: "Sign-in expired or could not be verified.",
};

async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
	const res = await fetch(`${API_URL}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
			...(init.headers ?? {}),
		},
	});
	if (!res.ok) {
		let message = `${res.status} ${res.statusText}`;
		try {
			const body = (await res.json()) as { error?: string };
			if (body.error) message = API_ERROR_MESSAGES[body.error] ?? body.error;
		} catch {
			// Keep the HTTP status message when the response is not JSON.
		}
		throw new Error(message);
	}
	return (await res.json()) as T;
}

export const api = {
	me: (token: string) => request<Me>("/api/me", token),
	getPreferences: (token: string) => request<Preferences>("/api/preferences", token),
	putPreferences: (token: string, prefs: Omit<Preferences, "email">) =>
		request<Preferences>("/api/preferences", token, {
			method: "PUT",
			body: JSON.stringify(prefs),
		}),
};
