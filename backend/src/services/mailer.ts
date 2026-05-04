import nodemailer from "nodemailer";
import config from "../config";
import type { Meal, MenuByVenue } from "./dining";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: config.GMAIL_USER, pass: config.GMAIL_APP_PASSWORD },
});

const MEAL_TITLE: Record<Meal, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

function renderHtml(meal: Meal, menu: MenuByVenue, dateLabel: string): string {
  const sections = Object.entries(menu)
    .map(([venue, stations]) => {
      const stationBlocks = Object.entries(stations)
        .map(
          ([station, items]) =>
            `<h3 style="margin:12px 0 4px">${ station }</h3><ul>${ items
              .map((i) => `<li>${ i }</li>`)
              .join("") }</ul>`,
        )
        .join("");
      return `<section><h2 style="margin-top:24px">${ venue }</h2>${ stationBlocks }</section>`;
    })
    .join("");

  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;max-width:640px;margin:auto">
		<h1>${ MEAL_TITLE[meal] } — ${ dateLabel }</h1>
		${ sections || "<p><em>No menu available.</em></p>" }
		<hr><p style="color:#666;font-size:12px">You're receiving this because you subscribed at the Dartmouth Hugh portal.</p>
	</body></html>`;
}

/**
 * Send one HTML email per meal to `GMAIL_USER` with all subscribers in BCC.
 */
export async function sendMealEmail(
  meal: Meal,
  menu: MenuByVenue,
  recipients: string[],
): Promise<void> {
  if (recipients.length === 0) return;
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });
  await transporter.sendMail({
    from: `Tucker Ritti <${ config.GMAIL_USER }>`,
    to: config.GMAIL_USER,
    bcc: recipients,
    subject: `${ MEAL_TITLE[meal] } at Dartmouth — ${ dateLabel }`,
    html: renderHtml(meal, menu, dateLabel),
  });
}
