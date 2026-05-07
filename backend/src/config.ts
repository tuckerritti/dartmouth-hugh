import { z } from "zod";

const schema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	PORT: z.coerce.number().int().positive().default(4000),

	DATABASE_URL: z.string().min(1),
	FRONTEND_ORIGIN: z.url(),

	GOOGLE_CLIENT_ID: z.string().min(1),

	GMAIL_USER: z.email(),
	GMAIL_APP_PASSWORD: z.string().min(1),

	TIMEZONE: z.string().min(1).default("America/New_York"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
	console.error("[config] Invalid environment:", z.treeifyError(parsed.error));
	process.exit(1);
}

export default {
	...parsed.data,
	PRODUCTION: parsed.data.NODE_ENV === "production",
};
