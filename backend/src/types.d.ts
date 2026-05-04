declare global {
	namespace Express {
		interface Request {
			user?: { email: string; name: string | null };
		}
	}
}

export {};
