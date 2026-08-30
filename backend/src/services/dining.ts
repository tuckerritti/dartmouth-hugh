import { z } from "zod";

export const MEALS = ["breakfast", "lunch", "dinner"] as const;
export type Meal = (typeof MEALS)[number];

const TIMEZONE = "America/New_York";
const NUTRISLICE_API_BASE = "https://dartmouthcollege.api.nutrislice.com/menu/api";
const FOCO_LOCATION = "1953 Commons";

const FOCO_STATIONS = new Set([
	"A9",
	"Grill",
	"Hearth",
	"Herbivore",
	"Ma Thayer's",
	"Pavilion",
	"Sauté Fresh",
	"Soups",
]);

const NutrisliceFoodSchema = z.object({
	name: z.string().trim().min(1),
});

const NutrisliceMenuItemSchema = z.object({
	station_id: z.number().int().nullable(),
	is_station_header: z.boolean(),
	text: z.string(),
	food: NutrisliceFoodSchema.nullable(),
});

const NutrisliceDaySchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	menu_items: z.array(NutrisliceMenuItemSchema),
});

const NutrisliceMenuSchema = z.object({
	days: z.array(NutrisliceDaySchema),
});

type NutrisliceMenu = z.infer<typeof NutrisliceMenuSchema>;

export type MenuByVenue = Record<string, Record<string, string[]>>;
export type DailyMenus = Record<Meal, MenuByVenue>;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	timeZone: TIMEZONE,
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

function formatDate(date: Date): { key: string; path: string } {
	const parts = new Map(
		dateFormatter
			.formatToParts(date)
			.filter((part) => part.type !== "literal")
			.map((part) => [part.type, part.value]),
	);
	const year = parts.get("year");
	const month = parts.get("month");
	const day = parts.get("day");

	if (!year || !month || !day) throw new Error("could not format Dartmouth menu date");

	return {
		key: `${year}-${month}-${day}`,
		path: `${year}/${month}/${day}`,
	};
}

function formatShapeError(error: z.ZodError): string {
	return error.issues
		.map((issue) => `${issue.path.join(".") || "response"}: ${issue.message}`)
		.join("; ");
}

function parseNutrisliceMenu(json: unknown, meal: Meal): NutrisliceMenu {
	const parsed = NutrisliceMenuSchema.safeParse(json);
	if (!parsed.success) {
		throw new Error(`nutrislice ${meal} response shape changed: ${formatShapeError(parsed.error)}`);
	}
	return parsed.data;
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

function buildMenuForMeal(feed: NutrisliceMenu, meal: Meal, dateKey: string): MenuByVenue {
	const day = feed.days.find((candidate) => candidate.date === dateKey);
	if (!day) throw new Error(`nutrislice ${meal} response omitted requested date ${dateKey}`);

	const stationNames = new Map<number, string>();
	for (const item of day.menu_items) {
		if (!item.is_station_header) continue;
		if (item.station_id === null) {
			throw new Error(`nutrislice ${meal} response contains a station header without an id`);
		}

		const stationName = item.text.trim();
		if (!stationName) {
			throw new Error(`nutrislice ${meal} response contains an unnamed station`);
		}

		const existingName = stationNames.get(item.station_id);
		if (existingName && existingName !== stationName) {
			throw new Error(
				`nutrislice ${meal} response assigns station ${item.station_id} to both ${existingName} and ${stationName}`,
			);
		}
		stationNames.set(item.station_id, stationName);
	}

	const grouped = new Map<string, Set<string>>();
	for (const item of day.menu_items) {
		if (!item.food) continue;
		if (item.station_id === null) {
			throw new Error(`nutrislice ${meal} response contains food without a station id`);
		}

		const stationName = stationNames.get(item.station_id);
		if (!stationName) {
			throw new Error(
				`nutrislice ${meal} response contains food for unknown station ${item.station_id}`,
			);
		}
		if (!FOCO_STATIONS.has(stationName)) continue;

		getOrInit(grouped, stationName, () => new Set()).add(item.food.name);
	}

	if (grouped.size === 0) return {};

	const stations: Record<string, string[]> = {};
	for (const stationName of [...grouped.keys()].sort(sortStrings)) {
		stations[stationName] = [...grouped.get(stationName)!].sort(sortStrings);
	}

	return { [FOCO_LOCATION]: stations };
}

async function fetchMenuForMeal(
	meal: Meal,
	dateKey: string,
	datePath: string,
): Promise<MenuByVenue> {
	const url = `${NUTRISLICE_API_BASE}/weeks/school/1953-commons/menu-type/${meal}/${datePath}/`;
	const res = await fetch(url);

	if (res.status === 204) return {};
	if (!res.ok) throw new Error(`nutrislice ${meal} api ${res.status}`);

	let json: unknown;
	try {
		json = await res.json();
	} catch (error) {
		throw new Error(`nutrislice ${meal} api returned invalid JSON`, { cause: error });
	}

	return buildMenuForMeal(parseNutrisliceMenu(json, meal), meal, dateKey);
}

/**
 * Fetch the day's breakfast, lunch, and dinner menus from Nutrislice concurrently.
 * Includes all foods published under the configured 1953 Commons stations.
 */
export async function fetchDailyMenus(date: Date = new Date()): Promise<DailyMenus> {
	const { key: dateKey, path: datePath } = formatDate(date);
	const entries = await Promise.all(
		MEALS.map(async (meal) => [meal, await fetchMenuForMeal(meal, dateKey, datePath)] as const),
	);

	return Object.fromEntries(entries) as DailyMenus;
}
