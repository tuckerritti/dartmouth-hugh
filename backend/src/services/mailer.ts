import nodemailer from "nodemailer";
import config from "../config";
import { MEALS, type DailyMenus, type Meal, type MenuByVenue } from "./dining";

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: { user: config.GMAIL_USER, pass: config.GMAIL_APP_PASSWORD },
});

const MEAL_TITLE: Record<Meal, string> = {
	breakfast: "Breakfast",
	lunch: "Lunch",
	dinner: "Dinner",
};

const HTML_ESCAPE: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (char) => HTML_ESCAPE[char]);
}

function sortStrings(a: string, b: string): number {
	return a.localeCompare(b, "en-US");
}

function dateLabelFor(date: Date): string {
	return date.toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		timeZone: config.TIMEZONE,
	});
}

function renderVenueSections(menu: MenuByVenue): string {
	const sections = Object.entries(menu)
		.sort(([a], [b]) => sortStrings(a, b))
		.map(([venue, stations]) => {
			const stationBlocks = Object.entries(stations)
				.sort(([a], [b]) => sortStrings(a, b))
				.map(([station, items]) => {
					const itemRows = [...items]
						.sort(sortStrings)
						.map((item) => `<li style="margin:4px 0">${escapeHtml(item)}</li>`)
						.join("");

					return `<h4 style="margin:16px 0 6px;font-size:16px">${escapeHtml(station)}</h4><ul style="margin:0 0 12px 20px;padding:0">${itemRows}</ul>`;
				})
				.join("");

			return `<section style="margin-top:18px"><h3 style="margin:0 0 8px;font-size:18px">${escapeHtml(venue)}</h3>${stationBlocks}</section>`;
		})
		.join("");

	return sections || "<p><em>No menu available.</em></p>";
}

function renderMealSection(meal: Meal, menu: MenuByVenue): string {
	return `<section style="margin-top:28px"><h2 style="margin:0 0 8px;font-size:22px">${MEAL_TITLE[meal]}</h2>${renderVenueSections(menu)}</section>`;
}

function renderHtml(menus: DailyMenus, dateLabel: string): string {
	const sections = MEALS.map((meal) => renderMealSection(meal, menus[meal])).join("");

	return `<!doctype html><html><body style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.45;color:#1f2933;max-width:640px;margin:0 auto;padding:24px">
		<h1 style="margin:0 0 8px;font-size:28px">Dartmouth Dining - ${escapeHtml(dateLabel)}</h1>
		${sections}
		<hr style="border:0;border-top:1px solid #d8dee4;margin:28px 0 12px">
		<p style="color:#667085;font-size:12px;margin:0">You're receiving this because you subscribed at the Dartmouth Hugh portal.</p>
	</body></html>`;
}

export function buildDailyDigestEmail(
	menus: DailyMenus,
	date: Date = new Date(),
): { subject: string; html: string } {
	const dateLabel = dateLabelFor(date);
	return {
		subject: `Daily Menus - ${dateLabel}`,
		html: renderHtml(menus, dateLabel),
	};
}

/**
 * Send one daily HTML email to `GMAIL_USER` with all subscribers in BCC.
 */
export async function sendDailyDigestEmail(
	menus: DailyMenus,
	recipients: string[],
	date: Date = new Date(),
): Promise<void> {
	if (recipients.length === 0) return;

	const email = buildDailyDigestEmail(menus, date);
	await transporter.sendMail({
		from: `Tucker Ritti <${config.GMAIL_USER}>`,
		to: config.GMAIL_USER,
		bcc: recipients,
		subject: email.subject,
		html: email.html,
	});
}
