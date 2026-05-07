import { z } from "zod";

export type Meal = "breakfast" | "lunch" | "dinner";

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

type Row = {
	mealPeriod: string;
	location: string;
	station: string;
	itemName: string;
	kind: "real" | "header";
};

export type MenuByVenue = Record<string, Record<string, string[]>>;

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

function filterRows(items: RawItem[], meal: Meal, date: string): Row[] {
	const rows: Row[] = [];
	const wantMeal = MEAL_LABEL[meal];

	for (const item of items) {
		if (!INCLUDED_CATEGORIES.has(item.menuCategory)) continue;
		if (item.recipeCategory.some((category) => EXCLUDED_RECIPE_CATEGORIES.has(category))) {
			continue;
		}
		if (COMPONENT_PICKER.test(item.itemName)) continue;

		const kind: Row["kind"] = item.recipeCategory.includes("Menu Header") ? "header" : "real";

		for (const availability of item.datesAvailable) {
			if (availability.date !== date) continue;

			for (const menu of availability.menus) {
				if (menu.mealPeriod !== wantMeal) continue;
				if (!stationAllowed(item.mainLocationLabel, menu.subLocation)) continue;

				rows.push({
					mealPeriod: menu.mealPeriod,
					location: item.mainLocationLabel,
					station: menu.subLocation,
					itemName: item.itemName,
					kind,
				});
			}
		}
	}

	return rows;
}

function titleCase(value: string): string {
	return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function dropRedundantHeaders(rows: Row[]): Row[] {
	const groups = new Map<string, Row[]>();

	for (const row of rows) {
		const key = `${row.mealPeriod}|${row.location}|${row.station}`;
		const group = groups.get(key) ?? [];
		group.push(row);
		groups.set(key, group);
	}

	const filtered: Row[] = [];
	for (const group of groups.values()) {
		const realItems = group.filter((row) => row.kind === "real");
		if (realItems.length > 0) {
			filtered.push(...realItems);
			continue;
		}

		filtered.push(...group.map((row) => ({ ...row, itemName: titleCase(row.itemName) })));
	}

	return filtered;
}

function sortStrings(a: string, b: string): number {
	return a.localeCompare(b, "en-US");
}

function rowsToMenu(rows: Row[]): MenuByVenue {
	const grouped = new Map<string, Map<string, Set<string>>>();

	for (const row of rows) {
		const stations = grouped.get(row.location) ?? new Map<string, Set<string>>();
		const items = stations.get(row.station) ?? new Set<string>();

		items.add(row.itemName);
		stations.set(row.station, items);
		grouped.set(row.location, stations);
	}

	const menu: MenuByVenue = {};
	for (const location of [...grouped.keys()].sort(sortStrings)) {
		const stations = grouped.get(location)!;
		menu[location] = {};

		for (const station of [...stations.keys()].sort(sortStrings)) {
			menu[location][station] = [...stations.get(station)!].sort(sortStrings);
		}
	}

	return menu;
}

/**
 * Fetch the day's menu from the Dartmouth Dining API and group it by venue → station.
 * Filters to entree-style items at Collis Café and the configured 53 Commons stations.
 */
export async function fetchMenuFor(meal: Meal, date: Date = new Date()): Promise<MenuByVenue> {
	const dateKey = ymd(date);
	const url = `https://menu.dartmouth.edu/menuapi/mealitems?dates=${dateKey}`;
	const res = await fetch(url);

	if (!res.ok) throw new Error(`dining api ${res.status}`);

	const items = parseDiningFeed(await res.json());
	return rowsToMenu(dropRedundantHeaders(filterRows(items, meal, dateKey)));
}
