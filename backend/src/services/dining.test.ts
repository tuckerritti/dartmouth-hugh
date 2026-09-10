import { afterEach, describe, expect, it, mock } from "bun:test";
import { fetchDailyMenus, MEALS } from "./dining";

const originalFetch = globalThis.fetch;
const TEST_DATE = new Date("2026-08-31T02:00:00.000Z");
const DATE_KEY = "2026-08-30";
const DATE_PATH = "2026/08/30";

type MenuItem = {
	station_id: number | null;
	is_station_header: boolean;
	text: string;
	food: { name: string } | null;
};

function station(stationId: number | null, name: string): MenuItem {
	return {
		station_id: stationId,
		is_station_header: true,
		text: name,
		food: null,
	};
}

function food(stationId: number | null, name: string): MenuItem {
	return {
		station_id: stationId,
		is_station_header: false,
		text: "",
		food: { name },
	};
}

function feed(items: MenuItem[], date = DATE_KEY): unknown {
	return {
		days: [
			{
				date: "2026-08-29",
				menu_items: [station(1, "A9"), food(1, "Wrong day")],
			},
			{ date, menu_items: items },
		],
	};
}

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json" },
	});
}

function installFetch(
	handler: (input: string | URL | Request) => Response | Promise<Response>,
): void {
	globalThis.fetch = mock(handler) as unknown as typeof fetch;
}

afterEach(() => {
	globalThis.fetch = originalFetch;
});

describe("fetchDailyMenus", () => {
	it("fetches all meals concurrently using the Dartmouth date", async () => {
		const requests: string[] = [];
		const resolvers: Array<(response: Response) => void> = [];
		installFetch((input) => {
			requests.push(String(input));
			return new Promise<Response>((resolve) => resolvers.push(resolve));
		});

		const resultPromise = fetchDailyMenus(TEST_DATE);

		expect(requests).toEqual(
			MEALS.map(
				(meal) =>
					`https://dartmouthcollege.api.nutrislice.com/menu/api/weeks/school/1953-commons/menu-type/${meal}/${DATE_PATH}/`,
			),
		);
		for (const resolve of resolvers) resolve(jsonResponse(feed([])));

		expect(await resultPromise).toEqual({ breakfast: {}, lunch: {}, dinner: {} });
	});

	it("groups, filters, deduplicates, and sorts the requested day's foods", async () => {
		installFetch(() =>
			jsonResponse(
				feed([
					food(2, "Pizza Pepperoni"),
					station(3, "Bakery"),
					food(3, "Excluded Danish"),
					station(2, "Hearth"),
					food(2, "Pizza Cheese"),
					food(2, "Sauce Marinara"),
					station(1, "A9"),
					food(1, "Zucchini Bake"),
					food(1, "Apple Crisp"),
					food(1, "Apple Crisp"),
					food(1, "A9 Rice Spanish"),
					station(4, "Farmstand"),
					food(4, "Excluded Salad"),
					station(5, "Sauté Fresh"),
					food(5, "SF Eggs for Omelets"),
				]),
			),
		);

		const menus = await fetchDailyMenus(TEST_DATE);

		for (const meal of MEALS) {
			expect(menus[meal]).toEqual({
				"1953 Commons": {
					A9: ["Apple Crisp", "Zucchini Bake"],
					Hearth: ["Pizza Cheese", "Pizza Pepperoni"],
				},
			});
		}
	});

	it("treats an unpublished 204 meal as empty", async () => {
		installFetch(() => new Response(null, { status: 204 }));

		expect(await fetchDailyMenus(TEST_DATE)).toEqual({
			breakfast: {},
			lunch: {},
			dinner: {},
		});
	});

	it("rejects the digest when a meal request fails", async () => {
		installFetch((input) =>
			String(input).includes("/breakfast/")
				? new Response(null, { status: 503 })
				: new Response(null, { status: 204 }),
		);

		await expect(fetchDailyMenus(TEST_DATE)).rejects.toThrow("nutrislice breakfast api 503");
	});

	it("rejects invalid JSON", async () => {
		installFetch(() => new Response("not json", { status: 200 }));

		await expect(fetchDailyMenus(TEST_DATE)).rejects.toThrow(
			"nutrislice breakfast api returned invalid JSON",
		);
	});

	it("rejects a changed response shape", async () => {
		installFetch(() => jsonResponse({ days: [{ date: DATE_KEY }] }));

		await expect(fetchDailyMenus(TEST_DATE)).rejects.toThrow(
			"nutrislice breakfast response shape changed",
		);
	});

	it("rejects a response that omits the requested date", async () => {
		installFetch(() => jsonResponse(feed([], "2026-08-31")));

		await expect(fetchDailyMenus(TEST_DATE)).rejects.toThrow(
			`nutrislice breakfast response omitted requested date ${DATE_KEY}`,
		);
	});

	it("rejects food rows whose station header is missing", async () => {
		installFetch(() => jsonResponse(feed([food(99, "Orphaned Food")])));

		await expect(fetchDailyMenus(TEST_DATE)).rejects.toThrow(
			"nutrislice breakfast response contains food for unknown station 99",
		);
	});

	it("rejects conflicting names for the same station id", async () => {
		installFetch(() =>
			jsonResponse(feed([station(1, "A9"), station(1, "Hearth"), food(1, "Food")])),
		);

		await expect(fetchDailyMenus(TEST_DATE)).rejects.toThrow(
			"nutrislice breakfast response assigns station 1 to both A9 and Hearth",
		);
	});
});
