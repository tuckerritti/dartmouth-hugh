import type { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";
import config from "../config";
import { createOrUpdateUser } from "../database";

const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);
const ALLOWED_EMAIL_DOMAIN = "@dartmouth.edu";

/**
 * Verify the `Authorization: Bearer <idToken>` header against Google.
 * On success attaches `req.user = { email, name }` and upserts the user.
 */
export default async function requireAuth(req: Request, res: Response, next: NextFunction) {
	const header = req.headers.authorization;
	if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "ERR_UNAUTHORIZED" });

	const idToken = header.slice("Bearer ".length);

	try {
		const ticket = await client.verifyIdToken({
			idToken,
			audience: config.GOOGLE_CLIENT_ID,
		});

		const payload = ticket.getPayload();
		if (!payload?.email) return res.status(401).json({ error: "ERR_UNAUTHORIZED" });

		const email = payload.email.toLowerCase();
		if (!payload.email_verified || !email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
			return res.status(403).json({ error: "ERR_DARTMOUTH_EMAIL_REQUIRED" });
		}

		req.user = { email, name: payload.name ?? null };
		await createOrUpdateUser(req.user.email, req.user.name);

		return next();
	} catch {
		return res.status(401).json({ error: "ERR_UNAUTHORIZED" });
	}
}
