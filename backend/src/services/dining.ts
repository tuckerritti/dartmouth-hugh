export type Meal = "breakfast" | "lunch" | "dinner";

export const VENUES = ["Class of 1953 Commons", "Collis Café", "Courtyard Café"] as const;
export type Venue = (typeof VENUES)[number];

export const VENUE_LABEL: Record<Venue, string> = {
	"Class of 1953 Commons": "FoCo",
	"Collis Café": "Collis",
	"Courtyard Café": "Hop",
};

const MEAL_LABEL: Record<Meal, string> = {
	breakfast: "Breakfast",
	lunch: "Lunch",
	dinner: "Dinner",
};

type RawItem = {
	itemName?: string;
	stationName?: string;
	mealPeriod?: string;
	locationName?: string;
};

export type MenuByVenue = Record<string, Record<string, string[]>>;

function ymd(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}${m}${day}`;
}

/**
 * Fetch the day's menu from the Dartmouth Dining API and group it by venue → station.
 * Filters to only the requested meal period and the three venues we care about.
 */
export async function fetchMenuFor(meal: Meal, date: Date = new Date()): Promise<MenuByVenue> {
	const url = `https://menu.dartmouth.edu/menuapi/mealitems?dates=${ymd(date)}`;
	const res = await fetch(url);

	if (!res.ok) throw new Error(`dining api ${res.status}`);
	const items = (await res.json()) as RawItem[];

	const wantMeal = MEAL_LABEL[meal];
	const out: MenuByVenue = {};

	for (const item of items) {
		if (item.mealPeriod !== wantMeal) continue;

		const venue = item.locationName as Venue | undefined;

		if (!venue || !(VENUES as readonly string[]).includes(venue)) continue;

		const label = VENUE_LABEL[venue];

		const station = item.stationName ?? "Other";
		const name = item.itemName?.trim();

		if (!name) continue;

		out[label] ??= {};
		out[label][station] ??= [];
		out[label][station].push(name);
	}

	return out;
}
