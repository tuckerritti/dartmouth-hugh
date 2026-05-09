"use client";
import { useState } from "react";
import { Alert, Group, Stack, Switch, Text } from "@mantine/core";
import { useAuth } from "@/components/AuthProvider";
import { api, isUnauthorizedError, type Preferences } from "@/lib/api";

type Props = { token: string; initial: Preferences };

export function PreferencesForm({ token, initial }: Props) {
	const { signOut } = useAuth();
	const [prefs, setPrefs] = useState(initial);
	const [saving, setSaving] = useState(false);
	const [savedAt, setSavedAt] = useState<Date | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function save(next: Preferences, previous: Preferences) {
		setPrefs(next);
		setSaving(true);
		setError(null);
		setSavedAt(null);
		try {
			const updated = await api.putPreferences(token, {
				subscribed: next.subscribed,
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
			setSaving(false);
		}
	}

	function toggleSubscribed() {
		if (saving) return;
		void save({ ...prefs, subscribed: !prefs.subscribed }, prefs);
	}

	return (
		<Stack gap="lg">
			<Group justify="space-between" gap="md" wrap="wrap" align="center">
				<Stack gap={2}>
					<Text fw={700}>{prefs.subscribed ? "Daily email on" : "Daily email paused"}</Text>
					<Text size="sm" c="dimmed">
						Breakfast, lunch, and dinner each morning.
					</Text>
				</Stack>
				<Switch
					checked={prefs.subscribed}
					disabled={saving}
					onChange={toggleSubscribed}
					size="lg"
					aria-label="Toggle daily dining email"
				/>
			</Group>

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
