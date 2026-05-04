import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getPreferences, updatePreferences } from "../database";

const PreferencesBody = z.object({
	subscribed: z.boolean(),
	breakfast: z.boolean(),
	lunch: z.boolean(),
	dinner: z.boolean(),
});

/**
 * GET /api/preferences
 */
export async function getMyPreferences(req: Request, res: Response, next: NextFunction) {
	try {
		const prefs = await getPreferences(req.user!.email);
		res.json(prefs);
	} catch (err) {
		return next(err);
	}
}

/**
 * PUT /api/preferences
 */
export async function putMyPreferences(req: Request, res: Response, next: NextFunction) {
	const parsed = PreferencesBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: "ERR_MALFORMED_REQUEST" });

	try {
		const updated = await updatePreferences(req.user!.email, parsed.data);
		res.json(updated);
	} catch (err) {
		return next(err);
	}
}
