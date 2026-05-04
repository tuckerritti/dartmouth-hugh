import cron from "node-cron";
import config from "../config";
import { getSubscribersFor } from "../database";
import { fetchMenuFor, type Meal } from "./dining";
import { sendMealEmail } from "./mailer";

/**
 * Run a single meal end-to-end: fetch subscribers, fetch menu, send.
 * Returns the number of recipients the email was sent to (0 if skipped).
 */
export async function runMeal(meal: Meal): Promise<{ sent: number }> {
	const recipients = await getSubscribersFor(meal);
	if (recipients.length === 0) return { sent: 0 };

	const menu = await fetchMenuFor(meal);
	if (Object.keys(menu).length === 0) return { sent: 0 };

	await sendMealEmail(meal, menu, recipients);
	return { sent: recipients.length };
}

const SCHEDULE: Record<Meal, string> = {
	breakfast: "0 7 * * *",
	lunch: "0 11 * * *",
	dinner: "0 17 * * *",
};

/**
 * Register cron jobs for breakfast (07:00), lunch (11:00), and dinner (17:00) ET.
 */
export function startScheduler(): void {
	for (const [meal, expr] of Object.entries(SCHEDULE) as [Meal, string][]) {
		cron.schedule(
			expr,
			async () => {
				try {
					const { sent } = await runMeal(meal);

					console.log(`[cron] ${meal}: sent to ${sent} recipients`);
				} catch (err) {
					console.error(`[cron] ${meal} failed`, err);
				}
			},
			{ timezone: config.TIMEZONE },
		);
	}
	console.log(`scheduler started (07:00 / 11:00 / 17:00 ${config.TIMEZONE})`);
}
