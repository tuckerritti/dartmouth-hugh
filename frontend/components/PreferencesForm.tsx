"use client";
import { useState } from "react";
import { Alert, Divider, Group, Stack, Switch, Text } from "@mantine/core";
import { useAuth } from "@/components/AuthProvider";
import { api, isUnauthorizedError, type Preferences } from "@/lib/api";

type Props = { token: string; initial: Preferences };
type PreferenceKey = keyof Omit<Preferences, "email">;
type MealKey = Exclude<PreferenceKey, "subscribed">;

const MEALS: { key: MealKey; label: string; time: string }[] = [
	{ key: "breakfast", label: "Breakfast", time: "7:00 AM" },
	{ key: "lunch", label: "Lunch", time: "11:00 AM" },
	{ key: "dinner", label: "Dinner", time: "5:00 PM" },
];

export function PreferencesForm({ token, initial }: Props) {
	const { signOut } = useAuth();
	const [prefs, setPrefs] = useState(initial);
	const [savingKey, setSavingKey] = useState<PreferenceKey | null>(null);
	const [savedAt, setSavedAt] = useState<Date | null>(null);
	const [error, setError] = useState<string | null>(null);

	const saving = savingKey !== null;

	async function save(next: Preferences, previous: Preferences, key: PreferenceKey) {
		setPrefs(next);
		setSavingKey(key);
		setError(null);
		setSavedAt(null);
		try {
			const updated = await api.putPreferences(token, {
				subscribed: next.subscribed,
				breakfast: next.breakfast,
				lunch: next.lunch,
				dinner: next.dinner,
			});
			setPrefs(updated);
			setSavedAt(new Date());
		} catch (e) {
			if (isUnauthorizedError(e)) {
				signOut();
				return;
			}
			setPrefs(previous);
			setError(e instanceof Error ? e.message : "Could not save preferences");
		} finally {
			setSavingKey(null);
		}
	}

	function toggle(key: PreferenceKey) {
		return () => {
			if (saving) return;
			void save({ ...prefs, [key]: !prefs[key] }, prefs, key);
		};
	}

	return (
		<Stack gap="lg">
			<Group justify="space-between" gap="md" wrap="nowrap" align="center">
				<Stack gap={2}>
					<Text fw={700}>{prefs.subscribed ? "Emails on" : "Emails paused"}</Text>
				</Stack>
				<Switch
					checked={prefs.subscribed}
					disabled={saving}
					onChange={toggle("subscribed")}
					size="lg"
					aria-label="Toggle dining emails"
				/>
			</Group>

			<Divider />

			<Stack gap="xs">
				{MEALS.map((meal) => (
					<Group
						key={meal.key}
						justify="space-between"
						gap="md"
						wrap="nowrap"
						p="sm"
						style={{
							border: "1px solid var(--mantine-color-gray-3)",
							borderRadius: 8,
							backgroundColor: prefs.subscribed ? "transparent" : "var(--mantine-color-gray-0)",
							opacity: prefs.subscribed ? 1 : 0.72,
						}}
					>
						<Stack gap={0}>
							<Text fw={600}>{meal.label}</Text>
							<Text size="sm" c="dimmed">
								{meal.time}
							</Text>
						</Stack>
						<Switch
							checked={prefs[meal.key]}
							disabled={!prefs.subscribed || saving}
							onChange={toggle(meal.key)}
							aria-label={`Toggle ${meal.label.toLowerCase()} emails`}
						/>
					</Group>
				))}
			</Stack>

			{error && (
				<Alert color="red" variant="light" title="Could not save">
					{error}
				</Alert>
			)}
			<Text size="sm" c="dimmed">
				{saving
					? "Saving..."
					: savedAt
						? `Saved at ${savedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
						: "Changes save automatically."}
			</Text>
		</Stack>
	);
}
