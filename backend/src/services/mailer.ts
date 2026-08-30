import { readFileSync } from "node:fs";
import Handlebars from "handlebars";
import nodemailer from "nodemailer";
import config from "../config";
import { MEALS, type DailyMenus, type Meal } from "./dining";

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: { user: config.GMAIL_USER, pass: config.GMAIL_APP_PASSWORD },
});

const MEAL_TITLE: Record<Meal, string> = {
	breakfast: "Breakfast",
	lunch: "Lunch",
	dinner: "Dinner",
};

const MEAL_NUMBER: Record<Meal, string> = {
	breakfast: "01",
	lunch: "02",
	dinner: "03",
};

const MEAL_TIME: Record<Meal, string> = {
	breakfast: "7:00 - 11:00 AM",
	lunch: "11:00 AM - 4:00 PM",
	dinner: "4:00 - 8:30 PM",
};

type EmailItemRow = {
	left: string;
	right: string;
};

type EmailStation = {
	name: string;
	count: number;
	itemRows: EmailItemRow[];
};

type EmailVenue = {
	name: string;
	stations: EmailStation[];
};

type EmailMeal = {
	number: string;
	title: string;
	time: string;
	venues: EmailVenue[];
};

type DailyDigestTemplateData = {
	dateLabel: string;
	meals: EmailMeal[];
};

const dailyDigestTemplate = Handlebars.compile<DailyDigestTemplateData>(
	readFileSync(new URL("../templates/dailyDigestEmail.hbs", import.meta.url), "utf8"),
);

function sortStrings(a: string, b: string): number {
	return a.localeCompare(b, "en-US");
}

function buildItemRows(items: string[]): EmailItemRow[] {
	const sortedItems = [...items].sort(sortStrings);
	const rows: EmailItemRow[] = [];

	for (let index = 0; index < sortedItems.length; index += 2) {
		rows.push({
			left: sortedItems[index],
			right: sortedItems[index + 1] ?? "",
		});
	}

	return rows;
}

function dateLabelFor(date: Date): string {
	return date.toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric",
		timeZone: config.TIMEZONE,
	});
}

export function buildDailyDigestEmail(
	menus: DailyMenus,
	date: Date = new Date(),
): { subject: string; html: string } {
	const dateLabel = dateLabelFor(date);
	const templateData: DailyDigestTemplateData = {
		dateLabel,
		meals: MEALS.map((meal) => ({
			number: MEAL_NUMBER[meal],
			title: MEAL_TITLE[meal],
			time: MEAL_TIME[meal],
			venues: Object.entries(menus[meal])
				.sort(([a], [b]) => sortStrings(a, b))
				.map(([name, stations]) => ({
					name,
					stations: Object.entries(stations)
						.sort(([a], [b]) => sortStrings(a, b))
						.map(([stationName, items]) => ({
							name: stationName,
							count: items.length,
							itemRows: buildItemRows(items),
						})),
				})),
		})),
	};

	return {
		subject: `Daily Menus - ${dateLabel}`,
		html: dailyDigestTemplate(templateData),
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
