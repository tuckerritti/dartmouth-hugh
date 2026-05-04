import type { Express, Request, Response } from "express";
import requireAuth from "./middleware/requireAuth";
import { getMe } from "./controllers/me.controller";
import { getMyPreferences, putMyPreferences } from "./controllers/preferences.controller";

export default function routes(app: Express) {
	app.get("/", (req: Request, res: Response) => {
		res.sendStatus(200);
	});

	app.get("/api/me", requireAuth, getMe);

	app.get("/api/preferences", requireAuth, getMyPreferences);
	app.put("/api/preferences", requireAuth, putMyPreferences);

	app.use((_req: Request, res: Response) => {
		res.status(404).send("404");
	});
}
