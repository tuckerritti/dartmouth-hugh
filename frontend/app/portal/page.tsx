"use client";
import Link from "next/link";
import { Button, Stack, Text, Title } from "@mantine/core";
import { useAuth } from "@/components/AuthProvider";
import { PreferencesForm } from "@/components/PreferencesForm";

export default function PortalPage() {
	const { token, me } = useAuth();

	if (!token || !me) {
		return (
			<Stack gap="md">
				<Title order={1}>Sign in from home</Title>
				<Text>Use the Google sign-in button on the home page to manage your subscription.</Text>
				<Button component={Link} href="/" size="md" w="fit-content">
					Go home
				</Button>
			</Stack>
		);
	}

	return (
		<Stack gap="md">
			<Title order={1}>Hi, {me.name ?? me.email}</Title>
			<Text c="dimmed">{me.email}</Text>
			<PreferencesForm token={token} initial={me.preferences} />
		</Stack>
	);
}
