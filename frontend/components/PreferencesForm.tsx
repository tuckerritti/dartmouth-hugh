"use client";
import { useState } from "react";
import { Alert, Checkbox, Fieldset, Stack, Text } from "@mantine/core";
import { api, type Preferences } from "@/lib/api";

type Props = { token: string; initial: Preferences };

export function PreferencesForm({ token, initial }: Props) {
	const [prefs, setPrefs] = useState(initial);
	const [saving, setSaving] = useState(false);
	const [savedAt, setSavedAt] = useState<Date | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function save(next: Preferences) {
		setSaving(true);
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
			setError(e instanceof Error ? e.message : "Could not save preferences");
		} finally {
			setSaving(false);
		}
	}

	function toggle(key: keyof Omit<Preferences, "email">) {
		return () => save({ ...prefs, [key]: !prefs[key] });
	}

	return (
		<Stack gap="md">
			<Checkbox
				checked={prefs.subscribed}
				disabled={saving}
				onChange={toggle("subscribed")}
				label={
					<>
						<Text span fw={700}>
							Subscribed
						</Text>{" "}
						(master switch)
					</>
				}
			/>
			<Fieldset disabled={!prefs.subscribed || saving} variant="unstyled" p={0}>
				<Stack gap="xs">
					<Checkbox
						checked={prefs.breakfast}
						onChange={toggle("breakfast")}
						label="Breakfast (7:00 AM)"
					/>
					<Checkbox checked={prefs.lunch} onChange={toggle("lunch")} label="Lunch (11:00 AM)" />
					<Checkbox checked={prefs.dinner} onChange={toggle("dinner")} label="Dinner (5:00 PM)" />
				</Stack>
			</Fieldset>
			{error && (
				<Alert color="red" variant="light">
					{error}
				</Alert>
			)}
			<Text size="sm" c="dimmed">
				{saving ? "Saving…" : savedAt ? `Saved at ${savedAt.toLocaleTimeString()}` : ""}
			</Text>
		</Stack>
	);
}
