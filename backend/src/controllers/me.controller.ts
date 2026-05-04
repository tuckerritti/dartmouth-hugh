import type { Request, Response, NextFunction } from "express";
import { getPreferences } from "../database";

/**
 * GET /api/me
 *
 * Returns the signed-in user's email, name, and preferences.
 */
export async function getMe(req: Request, res: Response, next: NextFunction) {
	try {
		const preferences = await getPreferences(req.user!.email);

		res.json({ email: req.user!.email, name: req.user!.name, preferences });
	} catch (err) {
		return next(err);
	}
}
