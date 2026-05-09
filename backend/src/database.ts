import { PrismaClient, type Preferences } from "@prisma/client";

const prisma = new PrismaClient();
export default prisma;

/**
 * Insert a user on first sight, or update their name on subsequent visits.
 * Also ensures the matching preferences row exists.
 */
export async function createOrUpdateUser(email: string, name: string | null): Promise<void> {
	await prisma.user.upsert({
		where: { email },
		update: { name },
		create: { email, name, preferences: { create: {} } },
	});
}

/**
 * Get the preferences row for a user.
 */
export async function getPreferences(email: string): Promise<Preferences | null> {
	return prisma.preferences.findUnique({ where: { email } });
}

/**
 * Replace a user's preference flags.
 */
export async function updatePreferences(
	email: string,
	prefs: Pick<Preferences, "subscribed">,
): Promise<Preferences> {
	return prisma.preferences.update({ where: { email }, data: prefs });
}

/**
 * List the email addresses subscribed to the daily digest.
 */
export async function getSubscribers(): Promise<string[]> {
	const rows = await prisma.preferences.findMany({
		where: { subscribed: true },
		select: { email: true },
	});
	return rows.map((r) => r.email);
}
