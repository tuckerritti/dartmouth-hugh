import cron from "node-cron";
import * as Sentry from "@sentry/bun";
import config from "../config";
import { getSubscribers } from "../database";
import { fetchDailyMenus } from "./dining";
import { sendDailyDigestEmail } from "./mailer";

/**
 * Run the daily digest end-to-end: fetch subscribers, fetch all menus, send.
 * Returns the number of recipients the email was sent to (0 if skipped).
 */
export async function runDailyDigest(date: Date = new Date()): Promise<{ sent: number }> {
	const recipients = await getSubscribers();
	if (recipients.length === 0) return { sent: 0 };

	const menus = await fetchDailyMenus(date);

	await sendDailyDigestEmail(menus, recipients, date);
	return { sent: recipients.length };
}

/**
 * Register the daily morning digest cron job.
 */
export function startScheduler(): void {
	cron.schedule(
		config.EMAIL_SEND_CRON,
		async () => {
			try {
				const { sent } = await runDailyDigest();

				console.log(`[cron] daily digest: sent to ${sent} recipients`);
			} catch (err) {
				Sentry.captureException(err, {
					tags: {
						job: "daily-digest-email",
					},
				});
				Sentry.logger.error("cron daily digest failed", {
					job: "daily-digest-email",
				});
				console.error("[cron] daily digest failed", err);
			}
		},
		{ timezone: config.TIMEZONE },
	);
	console.log(`scheduler started (${config.EMAIL_SEND_CRON} ${config.TIMEZONE})`);
}
