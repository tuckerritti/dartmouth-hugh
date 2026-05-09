import { z } from "zod";

export const MEALS = ["breakfast", "lunch", "dinner"] as const;
export type Meal = (typeof MEALS)[number];

const MEAL_LABEL: Record<Meal, string> = {
	breakfast: "Breakfast",
	lunch: "Lunch",
	dinner: "Dinner",
};

const FOCO_LOCATION = "53 Commons";
const COLLIS_LOCATION = "Collis Café";

const FOCO_STATIONS = new Set([
	"A9",
	"Flat Top Grill",
	"Hearth",
	"Herbivore",
	"Ma Thayer's",
	"Pavilion",
	"Saute Fresh",
	"Soup",
]);

const INCLUDED_CATEGORIES = new Set(["Entrées", "Soup/Chili/Chowder", "Breakfast Favorites"]);

const EXCLUDED_RECIPE_CATEGORIES = new Set(["Cold Cereal", "Hot Cereal"]);
const COMPONENT_PICKER = /choices?\s+(for|of)\b/i;

const RawMenuSchema = z.object({
	mealPeriod: z.string().min(1),
	subLocation: z.string().min(1),
});

const RawDateSchema = z.object({
	date: z.string().min(1),
	menus: z.array(RawMenuSchema),
});

const RawItemSchema = z.object({
	itemName: z.string().min(1),
	mainLocationLabel: z.string().min(1),
	menuCategory: z.string().min(1),
	recipeCategory: z.array(z.string()),
	datesAvailable: z.array(RawDateSchema),
});

const DiningFeedSchema = z.object({
	mealItems: z.array(RawItemSchema),
});

type RawItem = z.infer<typeof RawItemSchema>;

export type MenuByVenue = Record<string, Record<string, string[]>>;
export type DailyMenus = Record<Meal, MenuByVenue>;

function ymd(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}${m}${day}`;
}

function formatShapeError(error: z.ZodError): string {
	return error.issues
		.map((issue) => `${issue.path.join(".") || "response"}: ${issue.message}`)
		.join("; ");
}

function parseDiningFeed(json: unknown): RawItem[] {
	const parsed = DiningFeedSchema.safeParse(json);
	if (!parsed.success) {
		throw new Error(`dining api response shape changed: ${formatShapeError(parsed.error)}`);
	}
	return parsed.data.mealItems;
}

function stationAllowed(location: string, station: string): boolean {
	if (location === COLLIS_LOCATION) return true;
	return location === FOCO_LOCATION && FOCO_STATIONS.has(station);
}

function isEntreeCandidate(item: RawItem): boolean {
	if (!INCLUDED_CATEGORIES.has(item.menuCategory)) return false;
	if (item.recipeCategory.some((category) => EXCLUDED_RECIPE_CATEGORIES.has(category))) return false;
	if (COMPONENT_PICKER.test(item.itemName)) return false;
	return true;
}

function titleCase(value: string): string {
	return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function sortStrings(a: string, b: string): number {
	return a.localeCompare(b, "en-US");
}

function getOrInit<K, V>(map: Map<K, V>, key: K, init: () => V): V {
	let value = map.get(key);
	if (value === undefined) {
		value = init();
		map.set(key, value);
	}
	return value;
}

type StationGroup = { items: Set<string>; headers: Set<string> };

function buildMenuForMeal(items: RawItem[], meal: Meal, date: string): MenuByVenue {
	const mealLabel = MEAL_LABEL[meal];
	const grouped = new Map<string, Map<string, StationGroup>>();

	for (const item of items) {
		if (!isEntreeCandidate(item)) continue;
		const isHeader = item.recipeCategory.includes("Menu Header");

		for (const availability of item.datesAvailable) {
			if (availability.date !== date) continue;

			for (const menu of availability.menus) {
				if (menu.mealPeriod !== mealLabel) continue;
				if (!stationAllowed(item.mainLocationLabel, menu.subLocation)) continue;

				const stations = getOrInit(grouped, item.mainLocationLabel, () => new Map());
				const group = getOrInit(stations, menu.subLocation, () => ({
					items: new Set(),
					headers: new Set(),
				}));
				(isHeader ? group.headers : group.items).add(item.itemName);
			}
		}
	}

	// Some stations publish only a "Menu Header" placeholder (e.g. "PASTA BAR")
	// instead of itemized dishes. Fall back to those — title-cased — when no real items exist.
	const menu: MenuByVenue = {};
	for (const location of [...grouped.keys()].sort(sortStrings)) {
		const stations = grouped.get(location)!;
		menu[location] = {};

		for (const station of [...stations.keys()].sort(sortStrings)) {
			const group = stations.get(station)!;
			const names =
				group.items.size > 0 ? [...group.items] : [...group.headers].map(titleCase);
			menu[location][station] = names.sort(sortStrings);
		}
	}

	return menu;
}

/**
 * Fetch the day's menu from the Dartmouth Dining API once and group it by meal, venue, and station.
 * Filters to entree-style items at Collis Café and the configured 53 Commons stations.
 */
export async function fetchDailyMenus(date: Date = new Date()): Promise<DailyMenus> {
	const dateKey = ymd(date);
	const url = `https://menu.dartmouth.edu/menuapi/mealitems?dates=${dateKey}`;
	const res = await fetch(url);

	if (!res.ok) throw new Error(`dining api ${res.status}`);

	const items = parseDiningFeed(await res.json());
	return {
		breakfast: buildMenuForMeal(items, "breakfast", dateKey),
		lunch: buildMenuForMeal(items, "lunch", dateKey),
		dinner: buildMenuForMeal(items, "dinner", dateKey),
	};
}
